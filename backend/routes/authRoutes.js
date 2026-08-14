const express = require('express');
const router = express.Router();
const {
  registerCustomer,
  registerVendor,
  registerTenant,
  login,
  getMe,
  updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');

// Customer Auth
router.post('/register-customer', resolveTenant, registerCustomer);

// Vendor / Store Owner Auth
router.post('/register-vendor', registerVendor);
router.post('/register-tenant', registerTenant); // Backward compatible alias

// Common Sign In & Profile Management
router.post('/login', resolveTenant, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
