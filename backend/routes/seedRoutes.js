const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const seedData = require('../utils/seedData');

router.post('/reset', async (req, res, next) => {
  try {
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Order.deleteMany({});
    await Coupon.deleteMany({});
    await seedData();
    res.status(200).json({ success: true, message: 'Database reset and re-seeded successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
