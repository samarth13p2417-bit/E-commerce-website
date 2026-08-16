const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const productSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
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
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0
    },
    comparePrice: {
      type: Number,
      default: null
    },
    category: {
      type: String,
      default: 'General'
    },
    stock: {
      type: Number,
      default: 10,
      min: 0
    },
    sku: {
      type: String,
      trim: true,
      default: ''
    },
    images: {
      type: [String],
      default: []
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active'
    },
    tags: {
      type: [String],
      default: []
    },
    rating: {
      type: Number,
      default: 4.8
    },
    reviewsCount: {
      type: Number,
      default: 12
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
productSchema.index({ tenantId: 1, category: 1 });
productSchema.index({ tenantId: 1, status: 1 });

const MongooseProduct = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = new Proxy(
  {},
  {
    get: (target, prop) => {
      const model = getModel('Product', MongooseProduct);
      const val = model[prop];
      return typeof val === 'function' ? val.bind(model) : val;
    }
  }
);
