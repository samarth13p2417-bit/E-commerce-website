const express = require('express');
const router = express.Router();
const {
  getTenants,
  getTenant,
  updateTenant
} = require('../controllers/tenantController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getTenants);
router.get('/:identifier', getTenant);
router.put('/:id', protect, authorize('tenant_admin', 'superadmin'), updateTenant);

module.exports = router;
