const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  validateCoupon
} = require('../controllers/orderController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { resolveTenant, requireTenant } = require('../middleware/tenant');

// Middleware to resolve tenant for all order endpoints
router.use(resolveTenant);

// Public / Customer order endpoints
router.post('/validate-coupon', requireTenant, validateCoupon);
router.post('/', optionalAuth, requireTenant, createOrder);
router.get('/my-orders', optionalAuth, requireTenant, getMyOrders);
router.get('/:id', optionalAuth, requireTenant, getOrderById);

// Merchant Admin orders management
router.get(
  '/',
  protect,
  authorize('tenant_admin', 'tenant_staff', 'superadmin'),
  requireTenant,
  getOrders
);

router.put(
  '/:id/status',
  protect,
  authorize('tenant_admin', 'tenant_staff', 'superadmin'),
  requireTenant,
  updateOrderStatus
);

module.exports = router;
