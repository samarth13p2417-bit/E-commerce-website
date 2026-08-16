const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const categorySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: 'tag'
    }
  },
  {
    timestamps: true
  }
);

categorySchema.index({ tenantId: 1, slug: 1 }, { unique: true });

const MongooseCategory = mongoose.models.Category || mongoose.model('Category', categorySchema);

module.exports = new Proxy(
  {},
  {
    get: (target, prop) => {
      const model = getModel('Category', MongooseCategory);
      const val = model[prop];
      return typeof val === 'function' ? val.bind(model) : val;
    }
  }
);
