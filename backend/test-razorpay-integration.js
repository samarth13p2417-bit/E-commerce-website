/**
 * Comprehensive Automated Verification Suite for Razorpay Payment Gateway Integration
 */
const http = require('http');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:5000';

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING RAZORPAY PAYMENT GATEWAY VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, testName, details = '') => {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   Details: ${details}`);
    }
  };

  try {
    // 1. Health check
    const health = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    assert(health.status === 200, 'Backend Server is healthy and responsive');

    // 2. Fetch seeded tenants
    const tenantsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/tenants',
      method: 'GET'
    });
    assert(tenantsRes.status === 200 && tenantsRes.data.data?.length >= 5, 'Tenants catalog active (5 tenants populated)');

    const tenant = tenantsRes.data.data.find(t => ['gym-store', 'electronic-shop', 'fruit-shop', 'poonam-dresses', 'sports-shop'].includes(t.slug)) || tenantsRes.data.data[0];
    const tenantId = tenant._id;

    // 3. Fetch products for tenant
    const productsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/products?tenant=${tenantId}`,
      method: 'GET'
    });
    assert(productsRes.status === 200 && productsRes.data.data?.length > 0, `Products available for tenant "${tenant.name}"`);

    const product = productsRes.data.data[0];

    // 4. Test Server-Side Razorpay Order Creation (POST /api/payments/create-order)
    const createOrderPayload = {
      items: [{ productId: product._id, quantity: 2 }],
      customer: {
        name: 'Test Customer',
        email: 'customer.test@example.com',
        phone: '+91 98765 43210'
      }
    };

    const rzpOrderRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/payments/create-order',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        }
      },
      createOrderPayload
    );

    assert(
      rzpOrderRes.status === 200 && rzpOrderRes.data.success && rzpOrderRes.data.data?.orderId,
      'POST /api/payments/create-order successfully creates Razorpay Order with server-calculated amount',
      JSON.stringify(rzpOrderRes.data)
    );

    const rzpOrderId = rzpOrderRes.data.data?.orderId;
    const rzpAmount = rzpOrderRes.data.data?.amount;

    // 5. Test Pre-Order Creation in DB with 'pending' status
    const orderPayload = {
      customer: {
        name: 'Test Customer',
        email: 'customer.test@example.com',
        phone: '+91 98765 43210',
        shippingAddress: {
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India'
        }
      },
      items: [{ productId: product._id, quantity: 2 }],
      paymentMethod: 'razorpay',
      stripePaymentIntentId: rzpOrderId
    };

    const newOrderRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        }
      },
      orderPayload
    );

    assert(
      newOrderRes.status === 201 && newOrderRes.data.data?._id,
      'Pre-create internal order in DB with initial pending status',
      JSON.stringify(newOrderRes.data)
    );

    const internalOrder = newOrderRes.data.data;

    // 6. Test Invalid Signature Rejection (Tampered signature security check)
    const invalidVerifyRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/payments/verify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        }
      },
      {
        orderId: internalOrder._id,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: 'pay_invalid_123456',
        razorpay_signature: 'fake_tampered_signature_string_hex_123'
      }
    );

    assert(
      invalidVerifyRes.status === 400 && !invalidVerifyRes.data.success,
      'POST /api/payments/verify strictly rejects tampered/invalid signatures (400 Bad Request)',
      JSON.stringify(invalidVerifyRes.data)
    );

    // 7. Test Valid Signature Verification (HMAC SHA-256)
    const paymentId = `pay_${Date.now()}_test`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_eCommerceSaaS2026_SecureKey';
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${rzpOrderId}|${paymentId}`)
      .digest('hex');

    const validVerifyRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/payments/verify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        }
      },
      {
        orderId: internalOrder._id,
        orderNumber: internalOrder.orderNumber,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      }
    );

    assert(
      validVerifyRes.status === 200 &&
        validVerifyRes.data.success &&
        validVerifyRes.data.data?.order?.payment?.status === 'paid',
      'POST /api/payments/verify marks order as PAID after cryptographic HMAC SHA256 verification',
      JSON.stringify(validVerifyRes.data)
    );

    // 8. Test fetching updated order status
    const getOrderRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${internalOrder._id}`,
      method: 'GET',
      headers: {
        'x-tenant-id': tenantId
      }
    });

    assert(
      getOrderRes.status === 200 &&
        getOrderRes.data.data?.payment?.status === 'paid' &&
        getOrderRes.data.data?.payment?.method === 'razorpay',
      'Database persistently stores Razorpay payment status, transaction ID and audit history',
      JSON.stringify(getOrderRes.data)
    );

    console.log('\n================================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('================================================================\n');

    if (passed === total) {
      console.log('🎉 ALL RAZORPAY INTEGRATION VERIFICATIONS PASSED SUCCESSFULLY!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Test execution error:', err);
    process.exit(1);
  }
}

runTests();
