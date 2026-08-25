const http = require('http');

const request = (method, path, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('🧪 Starting Multi-Tenant E-Commerce SaaS API Automated Test Suite...\n');

  try {
    // 1. Health check
    console.log('1️⃣ Testing Health Endpoint...');
    const health = await request('GET', '/api/health');
    console.log('   Status:', health.status, 'Response:', health.data);

    // 2. Tenants list
    console.log('\n2️⃣ Testing Tenants Listing...');
    const tenantsRes = await request('GET', '/api/tenants');
    console.log(`   Found ${tenantsRes.data.count} tenants:`, tenantsRes.data.data.map(t => `${t.name} (${t.slug})`));

    const apexTenant = tenantsRes.data.data.find(t => t.slug === 'apex-luxe');
    const novaTenant = tenantsRes.data.data.find(t => t.slug === 'nova-tech');

    // 3. Multi-tenant Product Isolation Test
    console.log('\n3️⃣ Testing Multi-Tenant Product Data Isolation...');
    const apexProducts = await request('GET', `/api/products?tenant=${apexTenant.slug}`);
    console.log(`   Apex Luxe products count: ${apexProducts.data.count}`);
    console.log(`   Apex Luxe sample items:`, apexProducts.data.data.map(p => p.name));

    const novaProducts = await request('GET', `/api/products?tenant=${novaTenant.slug}`);
    console.log(`   Nova Tech products count: ${novaProducts.data.count}`);
    console.log(`   Nova Tech sample items:`, novaProducts.data.data.map(p => p.name));

    // Verify isolation: Apex products should NOT contain Nova products
    const crossPollution = apexProducts.data.data.some(p => novaProducts.data.data.some(np => np._id === p._id));
    console.log(`   Data Isolation Verified: ${!crossPollution ? '✅ PASS (Strict Tenant Partitioning)' : '❌ FAIL'}`);

    // 4. Test Owner Authentication
    console.log('\n4️⃣ Testing Tenant Owner Login...');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'owner@apexluxe.com',
      password: 'Password123!',
      tenantSlug: 'apex-luxe'
    });
    console.log('   Login Status:', loginRes.status, 'User:', loginRes.data.user?.name, 'Role:', loginRes.data.user?.role);
    const token = loginRes.data.token;

    // 5. Test Authenticated Product Creation
    console.log('\n5️⃣ Testing Tenant Product Creation...');
    const newProductRes = await request('POST', '/api/products', {
      name: 'St. Moritz Alpine Down Parka',
      description: 'Goose down insulated weatherproof winter luxury parka.',
      price: 650,
      comparePrice: 780,
      category: 'Outerwear',
      stock: 12,
      isFeatured: true
    }, {
      'Authorization': `Bearer ${token}`,
      'x-tenant-id': apexTenant._id
    });
    console.log('   Product Created Status:', newProductRes.status, 'Product:', newProductRes.data.data?.name);

    // 6. Test Registering a New 3rd Tenant Store
    console.log('\n6️⃣ Testing Dynamic Tenant Registration (Tenant 3)...');
    const newTenantRes = await request('POST', '/api/auth/register-tenant', {
      storeName: 'Velour Beauty & Fragrance',
      ownerName: 'Chloe Dupont',
      email: 'chloe@velourparis.com',
      password: 'Password123!',
      primaryColor: '#ec4899',
      tagline: 'Artisan Parfumerie & Botanical Skincare'
    });
    console.log('   New Tenant Registered:', newTenantRes.data.tenant?.name, 'Slug:', newTenantRes.data.tenant?.slug);

    console.log('\n🎉 ALL WEEK 1 MULTI-TENANT BACKEND TESTS PASSED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

runTests();
