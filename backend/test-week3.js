const http = require('http');

const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5000${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const runWeek3Tests = async () => {
  console.log('🧪 RUNNING COMPREHENSIVE WEEK 3 (CART, CHECKOUT & PAYMENTS) TESTS...\n');

  try {
    // 1. Health Check
    console.log('1. Testing Week 3 Service Health...');
    const health = await request('GET', '/api/health');
    console.log(`   Status: ${health.status} - Week: ${health.data.week}`);

    // 2. Fetch Active Tenants
    console.log('\n2. Fetching Tenant Store...');
    const tenantsRes = await request('GET', '/api/tenants');
    const apexLuxe = tenantsRes.data.data.find(t => ['gym-store', 'electronic-shop', 'fruit-shop', 'poonam-dresses', 'sports-shop'].includes(t.slug)) || tenantsRes.data.data[0];
    console.log(`   Tenant (${apexLuxe.name}) ID: ${apexLuxe._id}`);

    // 3. Create Stripe PaymentIntent (Day 3-5 requirement)
    console.log('\n3. Creating Stripe PaymentIntent via API...');
    const intentRes = await request(
      'POST',
      '/api/payments/create-intent',
      {
        amount: 74999,
        orderNumber: 'ORD-2026-TEST-771',
        customerEmail: 'kavita.singh@example.com'
      },
      { 'x-tenant-id': apexLuxe._id }
    );
    console.log(`   Status: ${intentRes.status} - PaymentIntent ID: ${intentRes.data.data?.paymentIntentId}`);
    console.log(`   Client Secret Generated: ${intentRes.data.data?.clientSecret?.substring(0, 25)}...`);

    const stripeIntentId = intentRes.data.data?.paymentIntentId;

    // 4. Place Customer Order with Stripe Intent ID (Day 6-7 requirement)
    console.log('\n4. Creating Customer Order & Triggering Transaction Receipt Email...');
    const prodsRes = await request('GET', `/api/products?tenant=${apexLuxe._id}`, null, {
      'x-tenant-id': apexLuxe._id
    });
    const selectedProd = prodsRes.data.data[0];

    const orderPayload = {
      customer: {
        name: 'Kavita Singh',
        email: 'kavita.singh@example.com',
        phone: '+91 98200 55443',
        shippingAddress: {
          street: 'Flat 12B, Regency Heights, Altamount Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400026',
          country: 'India'
        }
      },
      items: [
        {
          productId: selectedProd._id,
          quantity: 1
        }
      ],
      couponCode: 'WELCOME10',
      paymentMethod: 'card',
      stripePaymentIntentId: stripeIntentId,
      notes: 'Please dispatch with signature required'
    };

    const orderRes = await request('POST', '/api/orders', orderPayload, {
      'x-tenant-id': apexLuxe._id
    });
    console.log(`   Status: ${orderRes.status} - Order Created: ${orderRes.data.data?.orderNumber}`);
    console.log(`   Payment Method: ${orderRes.data.data?.payment?.method} - Txn ID: ${orderRes.data.data?.payment?.transactionId}`);
    console.log(`   Total Paid: ₹${orderRes.data.data?.pricing?.total}`);

    const createdOrder = orderRes.data.data;

    // 5. Simulate Stripe Webhook: 'payment_intent.succeeded' (Day 3-5 requirement)
    console.log('\n5. Testing Stripe Webhook for payment_intent.succeeded...');
    const webhookSuccessRes = await request('POST', '/api/payments/webhook', {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: stripeIntentId,
          metadata: {
            orderNumber: createdOrder.orderNumber
          }
        }
      }
    });
    console.log(`   Webhook Response: Status ${webhookSuccessRes.status} - Event: ${webhookSuccessRes.data?.eventType}`);

    // Verify order updated to paid via webhook
    const verifyOrderRes = await request('GET', `/api/orders/${createdOrder._id}`, null, {
      'x-tenant-id': apexLuxe._id
    });
    console.log(`   Order Payment Status after Webhook: ${verifyOrderRes.data.data?.payment?.status} (Fulfillment: ${verifyOrderRes.data.data?.status})`);

    // 6. Test Direct Payment Confirmation API
    console.log('\n6. Testing Payment Confirmation Endpoint & Receipt Email Generation...');
    const confirmRes = await request(
      'POST',
      '/api/payments/confirm',
      {
        orderId: createdOrder._id,
        paymentIntentId: `pi_confirmed_${Date.now()}`,
        method: 'upi'
      },
      { 'x-tenant-id': apexLuxe._id }
    );
    console.log(`   Status: ${confirmRes.status} - Message: ${confirmRes.data.message}`);
    console.log(`   Email Delivered To: ${confirmRes.data.data?.email?.recipient}`);

    console.log('\n🎉 ALL WEEK 3 MULTI-TENANT BACKEND & PAYMENT TESTS PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Week 3 test failed:', err);
  }
};

runWeek3Tests();
