const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  seedStarterProducts
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { resolveTenant, requireTenant } = require('../middleware/tenant');

// Middleware to resolve tenant for all product endpoints
router.use(resolveTenant);

router.post('/seed-starter', requireTenant, seedStarterProducts);
router.get('/categories/list', requireTenant, getCategories);
router.get('/', requireTenant, getProducts);
router.get('/:id', requireTenant, getProduct);

// Protected routes (Tenant Admin and Staff only)
router.post(
  '/',
  protect,
  authorize('tenant_admin', 'tenant_staff', 'superadmin'),
  requireTenant,
  createProduct
);

router.put(
  '/:id',
  protect,
  authorize('tenant_admin', 'tenant_staff', 'superadmin'),
  requireTenant,
  updateProduct
);

router.delete(
  '/:id',
  protect,
  authorize('tenant_admin', 'superadmin'),
  requireTenant,
  deleteProduct
);

module.exports = router;
