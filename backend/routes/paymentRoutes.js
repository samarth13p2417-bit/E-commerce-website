const express = require('express');
const router = express.Router();
const {
  createRazorpayOrderHandler,
  verifyRazorpayPaymentHandler,
  createIntent,
  handleWebhook,
  confirmPayment
} = require('../controllers/paymentController');
const { resolveTenant, requireTenant } = require('../middleware/tenant');
const { optionalAuth } = require('../middleware/auth');

// Webhook endpoint (receives raw events)
router.post('/webhook', handleWebhook);

// Razorpay standard endpoints
router.post('/create-order', resolveTenant, requireTenant, optionalAuth, createRazorpayOrderHandler);
router.post('/verify', resolveTenant, requireTenant, optionalAuth, verifyRazorpayPaymentHandler);

// Aliases for compatibility
router.post('/razorpay/create-order', resolveTenant, requireTenant, optionalAuth, createRazorpayOrderHandler);
router.post('/razorpay/verify-payment', resolveTenant, requireTenant, optionalAuth, verifyRazorpayPaymentHandler);

// Direct payment endpoints
router.post('/create-intent', resolveTenant, requireTenant, createIntent);
router.post('/confirm', resolveTenant, requireTenant, confirmPayment);

module.exports = router;
