const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tenant name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Tenant slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    domain: {
      type: String,
      trim: true
    },
    tagline: {
      type: String,
      default: 'Exclusive collections & modern design'
    },
    branding: {
      primaryColor: {
        type: String,
        default: '#6366f1'
      },
      secondaryColor: {
        type: String,
        default: '#a855f7'
      },
      accentColor: {
        type: String,
        default: '#ec4899'
      },
      logoUrl: {
        type: String,
        default: ''
      },
      bannerText: {
        type: String,
        default: 'Free express shipping across India on orders over ₹999'
      }
    },
    plan: {
      type: String,
      enum: ['starter', 'growth', 'pro', 'enterprise'],
      default: 'growth'
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'trial'],
      default: 'active'
    },
    settings: {
      allowGuestCheckout: {
        type: Boolean,
        default: true
      },
      inventoryTracking: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true
  }
);

const MongooseTenant = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);

// Export proxy that routes to either Mongoose or MemoryModel based on DB connection state
module.exports = new Proxy(
  {},
  {
    get: (target, prop) => {
      const model = getModel('Tenant', MongooseTenant);
      const val = model[prop];
      return typeof val === 'function' ? val.bind(model) : val;
    }
  }
);
