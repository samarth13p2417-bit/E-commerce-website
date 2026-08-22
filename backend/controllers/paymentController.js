const Order = require('../models/Order');
const Tenant = require('../models/Tenant');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { createPaymentIntent, parseWebhookEvent } = require('../services/stripeService');
const {
  createRazorpayOrder,
  verifyPaymentSignature,
  RAZORPAY_KEY_ID
} = require('../services/razorpayService');
const { sendOrderConfirmationEmail } = require('../services/emailService');

// @desc    Create Razorpay Order with Server-Side Amount Calculation
// @route   POST /api/payments/create-order (or /api/payments/razorpay/create-order)
// @access  Public / Customer (Tenant context)
const createRazorpayOrderHandler = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    const { items, couponCode, customer, notes, amount: clientAmount } = req.body;

    let totalAmount = 0;

    // If items are provided, calculate total securely on the server
    if (items && Array.isArray(items) && items.length > 0) {
      let subtotal = 0;
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
        subtotal += product.price * qty;
      }

      let discountAmount = 0;
      if (couponCode) {
        const coupon = await Coupon.findOne({
          tenantId: req.tenantId,
          code: couponCode.trim().toUpperCase(),
          isActive: true
        });
        if (coupon && subtotal >= (coupon.minOrderAmount || 0)) {
          if (coupon.discountType === 'percentage') {
            discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = Math.min(coupon.discountValue, subtotal);
          }
        }
      }

      const shippingFee = subtotal >= 999 ? 0 : 99;
      totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);
    } else if (clientAmount && Number(clientAmount) > 0) {
      totalAmount = Number(clientAmount);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Valid cart items or order amount are required'
      });
    }

    const razorpayOrder = await createRazorpayOrder({
      amount: totalAmount,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      tenantId: req.tenantId,
      notes: {
        ...(notes || {}),
        customerName: customer?.name || '',
        customerEmail: customer?.email || ''
      }
    });

    res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        orderId: razorpayOrder.orderId,
        amount: razorpayOrder.amount, // in paise
        currency: razorpayOrder.currency,
        keyId: razorpayOrder.keyId || RAZORPAY_KEY_ID,
        isSimulated: razorpayOrder.isSimulated || false
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Razorpay Payment Signature and Update Order
// @route   POST /api/payments/verify (or /api/payments/razorpay/verify-payment)
// @access  Public / Customer (Tenant context)
const verifyRazorpayPaymentHandler = async (req, res, next) => {
  try {
    const {
      orderId,
      orderNumber,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay payment credentials (order_id, payment_id, signature)'
      });
    }

    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay payment signature. Payment verification failed.'
      });
    }

    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
    } else if (orderNumber) {
      order = await Order.findOne({ orderNumber });
    } else if (razorpay_order_id) {
      order = await Order.findOne({
        $or: [
          { 'payment.razorpayOrderId': razorpay_order_id },
          { 'payment.transactionId': razorpay_order_id }
        ]
      });
    }

    if (order) {
      // Check if user is authorized if order has a specific userId
      if (req.user && order.userId && order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'tenant_admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to verify payment for this order'
        });
      }

      order.payment.status = 'paid';
      order.payment.method = 'razorpay';
      order.payment.transactionId = razorpay_payment_id;
      order.payment.razorpayOrderId = razorpay_order_id;
      order.payment.razorpayPaymentId = razorpay_payment_id;
      order.payment.razorpaySignature = razorpay_signature;
      order.payment.verifiedAt = new Date();
      order.status = 'processing';

      const history = order.statusHistory || [];
      history.push({
        status: 'processing',
        timestamp: new Date(),
        note: `Payment verified via Razorpay (Payment ID: ${razorpay_payment_id}, Order ID: ${razorpay_order_id})`
      });
      order.statusHistory = history;

      await order.save();

      // Trigger email receipt
      try {
        await sendOrderConfirmationEmail(order);
      } catch (mailErr) {
        console.warn('Receipt email dispatch warning:', mailErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Razorpay payment verified successfully',
        data: {
          order,
          paymentStatus: 'paid',
          paymentId: razorpay_payment_id
        }
      });
    }

    // If order was not yet pre-created in DB, return verified credentials for order placement
    res.status(200).json({
      success: true,
      message: 'Razorpay signature verified successfully',
      data: {
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Direct PaymentIntent
// @route   POST /api/payments/create-intent
// @access  Public
const createIntent = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    const { amount, orderNumber, customerEmail } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required'
      });
    }

    const result = await createPaymentIntent({
      amount,
      currency: 'inr',
      orderNumber: orderNumber || `TEMP-${Date.now()}`,
      tenantId: req.tenantId,
      customerEmail: customerEmail || 'guest@example.com'
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_sample_omnistore_stripe_key',
        isSimulated: result.isSimulated || false
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Handle Webhook Events
// @route   POST /api/payments/webhook
// @access  Public
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = parseWebhookEvent(req.body, signature, endpointSecret);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: `Webhook signature error: ${err.message}`
      });
    }

    const eventType = event.type || event.event;
    const dataObject = event.data?.object || event.payload || event;

    console.log(`⚡ Processing Webhook Event: "${eventType}"`);

    switch (eventType) {
      case 'payment_intent.succeeded': {
        const paymentIntentId = dataObject.id || dataObject.paymentIntentId;
        const orderNumber = dataObject.metadata?.orderNumber || dataObject.orderNumber;

        let order = null;
        if (orderNumber) {
          order = await Order.findOne({ orderNumber });
        }
        if (!order && paymentIntentId) {
          order = await Order.findOne({ 'payment.transactionId': paymentIntentId });
        }

        if (order) {
          order.payment.status = 'paid';
          order.payment.transactionId = paymentIntentId;
          order.status = 'processing';

          const history = order.statusHistory || [];
          history.push({
            status: 'processing',
            timestamp: new Date(),
            note: `Payment verified successfully (Transaction ID: ${paymentIntentId})`
          });
          order.statusHistory = history;
          await order.save();

          await sendOrderConfirmationEmail(order);
          console.log(`✅ Order ${order.orderNumber} successfully marked as PAID via Webhook`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    res.status(200).json({ received: true, eventType });
  } catch (err) {
    next(err);
  }
};

// @desc    Confirm payment & trigger confirmation email
// @route   POST /api/payments/confirm
// @access  Public
const confirmPayment = async (req, res, next) => {
  try {
    const { orderId, paymentIntentId, method = 'card' } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.payment.status = 'paid';
    order.payment.method = method;
    if (paymentIntentId) {
      order.payment.transactionId = paymentIntentId;
    }
    order.status = 'processing';

    const history = order.statusHistory || [];
    history.push({
      status: 'processing',
      timestamp: new Date(),
      note: `Payment confirmed via ${method.toUpperCase()} (${paymentIntentId || 'TXN-SUCCESS'})`
    });
    order.statusHistory = history;

    await order.save();

    const emailResult = await sendOrderConfirmationEmail(order);

    res.status(200).json({
      success: true,
      message: 'Payment confirmed and receipt email dispatched',
      data: {
        order,
        email: emailResult
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRazorpayOrderHandler,
  verifyRazorpayPaymentHandler,
  createIntent,
  handleWebhook,
  confirmPayment
};
