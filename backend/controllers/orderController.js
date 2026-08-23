const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { sendOrderConfirmationEmail } = require('../services/emailService');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Public / Customer / Guest
const createOrder = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    const { customer, items, couponCode, paymentMethod, notes, stripePaymentIntentId } = req.body;

    if (!customer || !customer.name || !customer.email || !customer.phone || !customer.shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Complete customer contact and shipping address details are required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Verify and calculate item totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found`
        });
      }

      if (product.tenantId.toString() !== req.tenantId.toString()) {
        return res.status(403).json({
          success: false,
          message: `Product "${product.name}" does not belong to this store`
        });
      }

      const qty = parseInt(item.quantity) || 1;
      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${qty}`
        });
      }

      const price = product.price;
      const itemTotal = price * qty;
      subtotal += itemTotal;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price,
        quantity: qty,
        image: product.images?.[0] || '',
        sku: product.sku || '',
        itemTotal
      });
    }

    // Process coupon code if provided
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        tenantId: req.tenantId,
        code: couponCode.trim().toUpperCase(),
        isActive: true
      });

      if (coupon) {
        if (subtotal >= (coupon.minOrderAmount || 0)) {
          if (coupon.discountType === 'percentage') {
            discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = Math.min(coupon.discountValue, subtotal);
          }
          appliedCoupon = coupon.code;
        }
      }
    }

    // Shipping rules: Free shipping if subtotal > 999, else 99
    const shippingFee = subtotal >= 999 ? 0 : 99;
    const tax = Math.round((subtotal - discountAmount) * 0.05); // 5% GST included
    const total = Math.max(0, subtotal - discountAmount + shippingFee);

    // Generate unique order number
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `ORD-${new Date().getFullYear()}-${randomDigits}`;

    // Reduce inventory stock
    for (const item of validatedItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        await Product.findByIdAndUpdate(product._id, {
          stock: Math.max(0, product.stock - item.quantity)
        });
      }
    }

    const orderData = {
      tenantId: req.tenantId,
      orderNumber,
      userId: req.user ? req.user._id : null,
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone.trim(),
        shippingAddress: {
          street: customer.shippingAddress.street || '',
          city: customer.shippingAddress.city || '',
          state: customer.shippingAddress.state || '',
          postalCode: customer.shippingAddress.postalCode || '',
          country: customer.shippingAddress.country || 'India'
        }
      },
      items: validatedItems,
      pricing: {
        subtotal,
        discountAmount,
        couponCode: appliedCoupon,
        shippingFee,
        tax,
        total,
        currency: 'INR'
      },
      payment: {
        method: paymentMethod || 'upi',
        status: paymentMethod === 'cod' ? 'pending' : 'paid',
        transactionId: stripePaymentIntentId || `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
      },
      status: 'processing',
      notes: notes || '',
      statusHistory: [
        {
          status: 'processing',
          timestamp: new Date(),
          note: `Order placed and payment confirmed (${paymentMethod || 'upi'}).`
        }
      ]
    };

    const order = await Order.create(orderData);

    // Send transaction confirmation receipt email
    await sendOrderConfirmationEmail(order);

    res.status(201).json({
      success: true,
      message: 'Order created successfully and confirmation email sent',
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders for the current tenant
// @route   GET /api/orders
// @access  Tenant Admin
const getOrders = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    const { status, search, limit = 50 } = req.query;
    const query = { tenantId: req.tenantId };

    if (status && status !== 'all') {
      query.status = status;
    }

    let ordersQuery = Order.find(query).sort({ createdAt: -1 });
    let orders = await ordersQuery;

    if (search) {
      const s = search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(s) ||
          o.customer?.name?.toLowerCase().includes(s) ||
          o.customer?.email?.toLowerCase().includes(s) ||
          o.customer?.phone?.includes(s)
      );
    }

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get customer's orders
// @route   GET /api/orders/my-orders
// @access  Public (By Email or User Token)
const getMyOrders = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    const email = req.query.email || (req.user && req.user.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Customer email or authentication required'
      });
    }

    const orders = await Order.find({
      tenantId: req.tenantId,
      'customer.email': email.trim().toLowerCase()
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Public / Tenant Admin
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (req.tenantId && order.tenantId.toString() !== req.tenantId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Order belongs to another store'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Tenant Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (req.tenantId && order.tenantId.toString() !== req.tenantId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Order belongs to another store'
      });
    }

    const history = order.statusHistory || [];
    history.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`
    });

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        statusHistory: history
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Validate coupon code
// @route   POST /api/orders/validate-coupon
// @access  Public
const validateCoupon = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    const { code, subtotal = 0 } = req.body;
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    const coupon = await Coupon.findOne({
      tenantId: req.tenantId,
      code: code.trim().toUpperCase(),
      isActive: true
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired promo code for this store'
      });
    }

    if (subtotal < (coupon.minOrderAmount || 0)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount.toLocaleString('en-IN')} required for this coupon`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = Math.min(coupon.discountValue, subtotal);
    }

    res.status(200).json({
      success: true,
      message: `Promo code "${coupon.code}" applied!`,
      data: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        calculatedDiscount: discount
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  validateCoupon
};
