const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class QueryBuilder {
  constructor(model, filter = {}, single = false) {
    this.model = model;
    this.filter = filter;
    this.single = single;
    this.sortOptions = null;
    this.selectFields = null;
    this.populateField = null;
  }

  sort(options) {
    this.sortOptions = options;
    return this;
  }

  select(fields) {
    this.selectFields = fields;
    return this;
  }

  populate(field) {
    this.populateField = field;
    return this;
  }

  async _execute() {
    let docs = this.model.documents.filter((d) => this.model._matchFilter(d, this.filter));

    if (this.sortOptions) {
      docs = [...docs].sort((a, b) => {
        for (const [field, order] of Object.entries(this.sortOptions)) {
          if (a[field] < b[field]) return order === 1 ? -1 : 1;
          if (a[field] > b[field]) return order === 1 ? 1 : -1;
        }
        return 0;
      });
    }

    if (this.single) {
      const first = docs[0];
      return first ? this.model._wrapDocument(first) : null;
    }

    return docs.map((d) => this.model._wrapDocument(d));
  }

  // Make it a Thenable so it can be awaited
  then(resolve, reject) {
    return this._execute().then(resolve, reject);
  }
}

class MemoryModel {
  constructor(name) {
    this.modelName = name;
    this.documents = [];
  }

  _generateId() {
    return crypto.randomBytes(12).toString('hex');
  }

  async countDocuments(filter = {}) {
    const docs = this.documents.filter((d) => this._matchFilter(d, filter));
    return docs.length;
  }

  find(filter = {}) {
    return new QueryBuilder(this, filter, false);
  }

  findOne(filter = {}) {
    return new QueryBuilder(this, filter, true);
  }

  findById(id) {
    if (!id) return new QueryBuilder(this, { _id: '__none__' }, true);
    return new QueryBuilder(this, { _id: id.toString() }, true);
  }

  async create(data) {
    const _id = this._generateId();
    let docData = {
      status: 'active',
      ...data,
      _id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (this.modelName === 'User' && docData.password) {
      const salt = await bcrypt.genSalt(10);
      docData.password = await bcrypt.hash(docData.password, salt);
    }

    this.documents.push(docData);
    return this._wrapDocument(docData);
  }

  async insertMany(items) {
    const created = [];
    for (const item of items) {
      const res = await this.create(item);
      created.push(res);
    }
    return created;
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    if (!id) return null;
    const index = this.documents.findIndex((d) => d._id && d._id.toString() === id.toString());
    if (index === -1) return null;

    const existing = this.documents[index];
    const updated = {
      ...existing,
      ...updateData,
      updatedAt: new Date()
    };
    this.documents[index] = updated;
    return this._wrapDocument(updated);
  }

  async findOneAndDelete(filter) {
    if (!filter) return null;
    const index = this.documents.findIndex((d) => this._matchFilter(d, filter));
    if (index === -1) return null;
    const deleted = this.documents.splice(index, 1)[0];
    return this._wrapDocument(deleted);
  }

  async deleteMany(filter = {}) {
    if (Object.keys(filter).length === 0) {
      this.documents = [];
      return { deletedCount: 0 };
    }
    this.documents = this.documents.filter((doc) => !this._matchFilter(doc, filter));
    return { deletedCount: 1 };
  }

  async distinct(field, filter = {}) {
    const filtered = this.documents.filter((doc) => this._matchFilter(doc, filter));
    const values = new Set();
    filtered.forEach((doc) => {
      if (doc[field] !== undefined) {
        values.add(doc[field]);
      }
    });
    return Array.from(values);
  }

  _getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    if (Object.prototype.hasOwnProperty.call(obj, path)) return obj[path];
    const parts = path.split('.');
    let curr = obj;
    for (const part of parts) {
      if (curr === null || curr === undefined) return undefined;
      curr = curr[part];
    }
    return curr;
  }

  _matchFilter(doc, filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (key === '$or' && Array.isArray(value)) {
        const anyMatch = value.some((subFilter) => this._matchFilter(doc, subFilter));
        if (!anyMatch) return false;
        continue;
      }

      const docVal = this._getNestedValue(doc, key);

      if (key === '_id' || key === 'tenantId') {
        const strDocVal = docVal?.toString();
        const filterVal = value?.toString();
        if (strDocVal !== filterVal) return false;
        continue;
      }

      if (value && typeof value === 'object' && value.$in && Array.isArray(value.$in)) {
        const matches = value.$in.some((v) => v?.toString() === docVal?.toString());
        if (!matches) return false;
        continue;
      }

      if (value && typeof value === 'object' && value.$regex) {
        const regex = new RegExp(value.$regex, value.$options || '');
        if (!regex.test(docVal || '')) return false;
        continue;
      }

      if (docVal !== value) {
        return false;
      }
    }
    return true;
  }

  _wrapDocument(rawDoc) {
    const modelInstance = {
      ...rawDoc,
      toObject: () => ({ ...rawDoc }),
      toJSON: () => ({ ...rawDoc }),
      save: async () => {
        const idx = this.documents.findIndex((d) => d._id.toString() === rawDoc._id.toString());
        if (idx !== -1) {
          rawDoc.updatedAt = new Date();
          this.documents[idx] = { ...rawDoc };
        }
        return modelInstance;
      }
    };

    if (this.modelName === 'User') {
      modelInstance.matchPassword = async function (enteredPassword) {
        return await bcrypt.compare(enteredPassword, rawDoc.password);
      };
    }

    return modelInstance;
  }
}

module.exports = { MemoryModel };
