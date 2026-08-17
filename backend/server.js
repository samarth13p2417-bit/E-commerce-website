const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const seedData = require('./utils/seedData');

// Route files
const authRoutes = require('./routes/authRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const seedRoutes = require('./routes/seedRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-tenant-slug', 'stripe-signature']
  })
);

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/seed', seedRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Multi-Tenant E-Commerce SaaS Backend',
    week: 'Week 3 (Cart, Checkout & Payments)'
  });
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedData();

    const server = app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Multi-Tenant E-Commerce Backend running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📦 Seeded Tenants (5):`);
      console.log(`   1. Titan Gym & Fitness Store (gym-store) - Free Weights & Benches`);
      console.log(`   2. Velocity Pro Sports Arena (sports-shop) - Cricket & Match Gear`);
      console.log(`   3. Fresh Orchard Organic Fruit Shop (fruit-shop) - Farm-Fresh Fruits`);
      console.log(`   4. Poonam Dresses (poonam-dresses) - Bridal Lehengas & Sarees`);
      console.log(`   5. Quantum Electronics & Gadgets (electronic-shop) - Phones & Laptops`);
      console.log(`======================================================\n`);
    });

    return server;
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
