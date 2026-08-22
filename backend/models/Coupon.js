const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const couponSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: 0
    },
    minOrderAmount: {
      type: Number,
      default: 0
    },
    maxDiscount: {
      type: Number,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

couponSchema.index({ tenantId: 1, code: 1 }, { unique: true });

const MongooseCoupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

module.exports = new Proxy(
  {},
  {
    get: (target, prop) => {
      const model = getModel('Coupon', MongooseCoupon);
      const val = model[prop];
      return typeof val === 'function' ? val.bind(model) : val;
    }
  }
);
