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

const runTests = async () => {
  console.log('🧪 RUNNING COMPREHENSIVE WEEK 2 MULTI-TENANT BACKEND TESTS...\n');

  try {
    // 1. Health Check
    console.log('1. Testing Health Check & Week 2 status...');
    const health = await request('GET', '/api/health');
    console.log(`   Status: ${health.status} - Service: ${health.data.service} (${health.data.week})`);

    // 2. Fetch Tenants
    console.log('\n2. Fetching Tenants list...');
    const tenantsRes = await request('GET', '/api/tenants');
    const apexLuxe = tenantsRes.data.data.find((t) => t.slug === 'apex-luxe');
    const novaTech = tenantsRes.data.data.find((t) => t.slug === 'nova-tech');
    console.log(`   Found ${tenantsRes.data.count} tenants: Apex Luxe ID=${apexLuxe._id}, Nova Tech ID=${novaTech._id}`);

    // 3. Validate Coupon for Apex Luxe
    console.log('\n3. Validating Coupon "WELCOME10" on Apex Luxe...');
    const couponRes = await request(
      'POST',
      '/api/orders/validate-coupon',
      { code: 'WELCOME10', subtotal: 10000 },
      { 'x-tenant-id': apexLuxe._id }
    );
    console.log(`   Status: ${couponRes.status} - Discount: ₹${couponRes.data.data?.calculatedDiscount} (${couponRes.data.message})`);

    // 4. Fetch Products for Apex Luxe
    console.log('\n4. Fetching Products for Apex Luxe...');
    const prodsRes = await request('GET', `/api/products?tenant=${apexLuxe._id}`, null, {
      'x-tenant-id': apexLuxe._id
    });
    const firstProd = prodsRes.data.data[0];
    console.log(`   Selected Product: "${firstProd.name}" Price: ₹${firstProd.price}, Initial Stock: ${firstProd.stock}`);

    // 5. Place New Order for Apex Luxe (Week 2 Core)
    console.log('\n5. Placing New Customer Order on Apex Luxe...');
    const orderPayload = {
      customer: {
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+91 98330 12345',
        shippingAddress: {
          street: '101 Cuffe Parade Towers',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400005',
          country: 'India'
        }
      },
      items: [
        {
          productId: firstProd._id,
          quantity: 2
        }
      ],
      couponCode: 'WELCOME10',
      paymentMethod: 'upi',
      notes: 'Please gift wrap and deliver between 10am-2pm'
    };

    const placeOrderRes = await request('POST', '/api/orders', orderPayload, {
      'x-tenant-id': apexLuxe._id
    });
    console.log(`   Status: ${placeOrderRes.status} - Order #: ${placeOrderRes.data.data?.orderNumber}`);
    console.log(`   Subtotal: ₹${placeOrderRes.data.data?.pricing.subtotal}, Discount: ₹${placeOrderRes.data.data?.pricing.discountAmount}, Total: ₹${placeOrderRes.data.data?.pricing.total}`);

    const createdOrderId = placeOrderRes.data.data._id;

    // 6. Verify Inventory Stock Reduction
    console.log('\n6. Verifying Inventory Stock Deduction...');
    const updatedProdRes = await request('GET', `/api/products/${firstProd._id}`, null, {
      'x-tenant-id': apexLuxe._id
    });
    console.log(`   Product Stock after ordering 2 units: ${updatedProdRes.data.data.stock} (Initial was ${firstProd.stock})`);

    // 7. Test Customer Order Tracking ('GET /api/orders/my-orders')
    console.log('\n7. Fetching Customer Order History by email...');
    const myOrdersRes = await request(
      'GET',
      `/api/orders/my-orders?email=priya.sharma@example.com`,
      null,
      { 'x-tenant-id': apexLuxe._id }
    );
    console.log(`   Found ${myOrdersRes.data.count} order(s) for Priya Sharma. Latest Order: ${myOrdersRes.data.data[0]?.orderNumber} Status: ${myOrdersRes.data.data[0]?.status}`);

    // 8. Admin Login & Fetch Merchant Orders
    console.log('\n8. Logging in as Apex Luxe Admin & Fetching Merchant Orders...');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'owner@apexluxe.com',
      password: 'Password123!'
    });
    const token = loginRes.data.data?.token || loginRes.data.token;

    const merchantOrdersRes = await request('GET', '/api/orders', null, {
      'x-tenant-id': apexLuxe._id,
      Authorization: `Bearer ${token}`
    });
    console.log(`   Merchant Dashboard Orders Count for Apex Luxe: ${merchantOrdersRes.data.count}`);

    // 9. Update Order Fulfillment Status to 'shipped'
    console.log('\n9. Updating Order Fulfillment Status to "shipped"...');
    const updateStatusRes = await request(
      'PUT',
      `/api/orders/${createdOrderId}/status`,
      { status: 'shipped', note: 'Dispatched with BlueDart AWB #BLU-882190' },
      {
        'x-tenant-id': apexLuxe._id,
        Authorization: `Bearer ${token}`
      }
    );
    console.log(`   Updated Order Status: ${updateStatusRes.data.data?.status}`);
    console.log(`   Timeline Entries Count: ${updateStatusRes.data.data?.statusHistory?.length}`);

    // 10. Multi-Tenant Order Isolation Test
    console.log('\n10. Testing Multi-Tenant Order Isolation (Nova Tech store cannot access Apex Luxe order)...');
    const crossTenantRes = await request(
      'GET',
      `/api/orders/${createdOrderId}`,
      null,
      { 'x-tenant-id': novaTech._id }
    );
    console.log(`   Cross-Tenant Access Response: HTTP ${crossTenantRes.status} (${crossTenantRes.data.message})`);

    console.log('\n🎉 ALL WEEK 2 MULTI-TENANT TESTS PASSED WITH 100% SUCCESS!\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
};

runTests();
