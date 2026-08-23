const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: {
    type: String,
    default: ''
  },
  sku: {
    type: String,
    default: ''
  },
  itemTotal: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    customer: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
      },
      phone: {
        type: String,
        required: true,
        trim: true
      },
      shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, default: 'India' }
      }
    },
    items: [orderItemSchema],
    pricing: {
      subtotal: {
        type: Number,
        required: true
      },
      discountAmount: {
        type: Number,
        default: 0
      },
      couponCode: {
        type: String,
        default: null
      },
      shippingFee: {
        type: Number,
        default: 0
      },
      tax: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: 'INR'
      }
    },
    payment: {
      method: {
        type: String,
        enum: ['upi', 'card', 'netbanking', 'cod', 'razorpay'],
        default: 'razorpay'
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
      },
      transactionId: {
        type: String,
        default: () => `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
      },
      razorpayOrderId: {
        type: String,
        default: null
      },
      razorpayPaymentId: {
        type: String,
        default: null
      },
      razorpaySignature: {
        type: String,
        default: null
      },
      verifiedAt: {
        type: Date,
        default: null
      }
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
      index: true
    },
    notes: {
      type: String,
      default: ''
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' }
      }
    ]
  },
  {
    timestamps: true
  }
);

orderSchema.index({ tenantId: 1, createdAt: -1 });
orderSchema.index({ tenantId: 1, 'customer.email': 1 });
orderSchema.index({ tenantId: 1, status: 1 });

const MongooseOrder = mongoose.models.Order || mongoose.model('Order', orderSchema);

module.exports = new Proxy(
  {},
  {
    get: (target, prop) => {
      const model = getModel('Order', MongooseOrder);
      const val = model[prop];
      return typeof val === 'function' ? val.bind(model) : val;
    }
  }
);
