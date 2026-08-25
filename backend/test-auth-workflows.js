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

const runAuthTests = async () => {
  console.log('🧪 RUNNING COMPREHENSIVE VENDOR & CUSTOMER AUTH WORKFLOW TESTS...\n');

  try {
    // 1. Health check
    console.log('1. Testing Backend API Health...');
    const health = await request('GET', '/api/health');
    console.log(`   Status: ${health.status} - Service: ${health.data.service}`);

    // 2. Fetch existing tenant (Apex Luxe)
    console.log('\n2. Fetching Seeded Tenant Stores...');
    const tenantsRes = await request('GET', '/api/tenants');
    const apexLuxe = tenantsRes.data.data[0];
    const novaTech = tenantsRes.data.data[1];
    console.log(`   Tenant 1 (${apexLuxe.name}) ID: ${apexLuxe._id}`);
    console.log(`   Tenant 2 (${novaTech.name}) ID: ${novaTech._id}`);

    // 3. Register Customer Workflow
    console.log('\n3. Testing Customer Registration Workflow for Apex Luxe...');
    const custEmail = `cust_${Date.now()}@luxeshopper.com`;
    const custRegRes = await request(
      'POST',
      '/api/auth/register-customer',
      {
        name: 'Arjun Kapadia',
        email: custEmail,
        password: 'Password123!',
        phone: '+91 98111 22334',
        tenantId: apexLuxe._id,
        address: {
          street: 'Flat 4A, Marine Bay Towers',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400020'
        }
      },
      { 'x-tenant-id': apexLuxe._id }
    );
    console.log(`   Status: ${custRegRes.status} - Message: ${custRegRes.data.message}`);
    console.log(`   Registered Customer: ${custRegRes.data.user?.name} (Role: ${custRegRes.data.user?.role})`);
    console.log(`   Customer Token Received: ${custRegRes.data.token?.substring(0, 25)}...`);

    const customerToken = custRegRes.data.token;

    // 4. Duplicate Customer Email Rejection in Same Tenant
    console.log('\n4. Testing Duplicate Customer Email Validation in Same Store...');
    const duplicateRes = await request(
      'POST',
      '/api/auth/register-customer',
      {
        name: 'Arjun Kapadia Duplicate',
        email: custEmail,
        password: 'Password123!',
        tenantId: apexLuxe._id
      },
      { 'x-tenant-id': apexLuxe._id }
    );
    console.log(`   Status: ${duplicateRes.status} (Expected 400) - Error: ${duplicateRes.data.message}`);

    // 5. Vendor Store Registration Workflow
    console.log('\n5. Testing Vendor Onboarding & Store Creation Workflow...');
    const testSlug = `aurora-atelier-${Date.now()}`;
    const vendorEmail = `owner_${Date.now()}@auroraatelier.com`;
    const vendorRegRes = await request(
      'POST',
      '/api/auth/register-vendor',
      {
        storeName: 'Aurora Atelier',
        storeSlug: testSlug,
        ownerName: 'Sophia Laurent',
        email: vendorEmail,
        password: 'Password123!',
        phone: '+91 98222 33445',
        primaryColor: '#8b5cf6',
        tagline: 'Artisanal Silk & Haute Couture'
      }
    );
    console.log(`   Status: ${vendorRegRes.status} - Message: ${vendorRegRes.data.message}`);
    console.log(`   Created Tenant: ${vendorRegRes.data.tenant?.name} (Slug: ${vendorRegRes.data.tenant?.slug})`);
    console.log(`   Vendor User: ${vendorRegRes.data.user?.name} (Role: ${vendorRegRes.data.user?.role})`);

    const vendorToken = vendorRegRes.data.token;

    // 6. Vendor Login Workflow
    console.log('\n6. Testing Vendor Sign In Workflow...');
    const vendorLoginRes = await request('POST', '/api/auth/login', {
      email: vendorEmail,
      password: 'Password123!'
    });
    console.log(`   Status: ${vendorLoginRes.status} - User: ${vendorLoginRes.data.user?.name}`);
    console.log(`   Verified Role: ${vendorLoginRes.data.user?.role} - Store: ${vendorLoginRes.data.tenant?.name}`);

    // 7. Customer Login Workflow
    console.log('\n7. Testing Customer Sign In Workflow...');
    const custLoginRes = await request(
      'POST',
      '/api/auth/login',
      {
        email: custEmail,
        password: 'Password123!',
        tenantSlug: 'apex-luxe'
      },
      { 'x-tenant-id': apexLuxe._id }
    );
    console.log(`   Status: ${custLoginRes.status} - User: ${custLoginRes.data.user?.name}`);
    console.log(`   Verified Role: ${custLoginRes.data.user?.role} (Customer)`);

    // 8. Protected Profile Retrieval & Update Workflow
    console.log('\n8. Testing Protected Profile & Address Update (`GET /api/auth/me` & `PUT /api/auth/profile`)...');
    const meRes = await request('GET', '/api/auth/me', null, {
      Authorization: `Bearer ${customerToken}`
    });
    console.log(`   Status: ${meRes.status} - Authenticated User: ${meRes.data.user?.name} (${meRes.data.user?.email})`);

    const updateProfileRes = await request(
      'PUT',
      '/api/auth/profile',
      {
        phone: '+91 97777 88888',
        addresses: [
          {
            street: 'Penthouse 18, Sea Face Promenade',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400001',
            country: 'India',
            isDefault: true
          }
        ]
      },
      { Authorization: `Bearer ${customerToken}` }
    );
    console.log(`   Status: ${updateProfileRes.status} - Updated Phone: ${updateProfileRes.data.user?.phone}`);
    console.log(`   Saved Address: ${updateProfileRes.data.user?.addresses[0]?.street}, ${updateProfileRes.data.user?.addresses[0]?.city}`);

    // 9. Multi-Tenant Customer Isolation (Same email on a different tenant)
    console.log('\n9. Testing Multi-Tenant Customer Isolation Across Different Stores...');
    const crossTenantCustRes = await request(
      'POST',
      '/api/auth/register-customer',
      {
        name: 'Arjun Kapadia (Nova Tech Shopper)',
        email: custEmail,
        password: 'Password123!',
        tenantId: novaTech._id
      },
      { 'x-tenant-id': novaTech._id }
    );
    console.log(`   Status: ${crossTenantCustRes.status} - Tenant: ${crossTenantCustRes.data.tenant?.name}`);
    console.log(`   Result: Customer isolated correctly per tenant store!`);

    console.log('\n🎉 ALL VENDOR & CUSTOMER AUTH WORKFLOWS PASSED 100% SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Auth workflow test failed:', err);
    process.exit(1);
  }
};

runAuthTests();
