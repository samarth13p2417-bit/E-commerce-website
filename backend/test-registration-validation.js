/**
 * Automated Test Suite: Registration & Input Validation for Customers and Vendors
 */

const http = require('http');

const request = (path, method = 'GET', data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
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
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

const runValidationTests = async () => {
  console.log('🧪 =======================================================');
  console.log('   MULTI-TENANT REGISTRATION VALIDATION TEST SUITE');
  console.log('=========================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, testName, extra = '') => {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${extra ? `(${extra})` : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${extra ? `(${extra})` : ''}`);
    }
  };

  // -------------------------------------------------------------
  // 1. CUSTOMER REGISTRATION VALIDATION TESTS
  // -------------------------------------------------------------
  console.log('--- 1. Customer Registration Validation ---');

  // Test 1.1: Missing required fields
  const c1 = await request('/auth/register-customer', 'POST', {});
  assert(c1.status === 400 && c1.data.success === false, 'Rejects empty customer payload');

  // Test 1.2: Invalid email format
  const c2 = await request('/auth/register-customer', 'POST', {
    name: 'Rahul Sharma',
    email: 'notanemail',
    password: 'Password123!'
  });
  assert(c2.status === 400 && c2.data.message.includes('valid email'), 'Rejects malformed customer email', c2.data.message);

  // Test 1.3: Weak password (no special char)
  const c3 = await request('/auth/register-customer', 'POST', {
    name: 'Rahul Sharma',
    email: 'rahul@test.com',
    password: 'Password123'
  });
  assert(c3.status === 400 && c3.data.message.includes('special character'), 'Rejects customer password lacking symbol', c3.data.message);

  // Test 1.4: Short password (<8 chars)
  const c4 = await request('/auth/register-customer', 'POST', {
    name: 'Rahul Sharma',
    email: 'rahul@test.com',
    password: 'Pa1!'
  });
  assert(c4.status === 400 && c4.data.message.includes('at least 8 characters'), 'Rejects short customer password', c4.data.message);

  // Test 1.5: Short name
  const c5 = await request('/auth/register-customer', 'POST', {
    name: 'R',
    email: 'rahul@test.com',
    password: 'Password123!'
  });
  assert(c5.status === 400 && c5.data.message.includes('at least 2 characters'), 'Rejects 1-char customer name', c5.data.message);

  // Test 1.6: Valid customer registration
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const c6 = await request('/auth/register-customer', 'POST', {
    name: 'Ananya Verma',
    email: `ananya${randNum}@gmail.com`,
    password: 'StrongPassword123!',
    phone: '+919876543210',
    tenantSlug: 'apex-luxe'
  });
  assert(c6.status === 201 && c6.data.token && c6.data.user.role === 'customer', 'Accepts valid customer registration', c6.data.message);

  // -------------------------------------------------------------
  // 2. VENDOR / STORE REGISTRATION VALIDATION TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. Vendor & Store Registration Validation ---');

  // Test 2.1: Missing storeName
  const v1 = await request('/auth/register-vendor', 'POST', {
    ownerName: 'Sunil Gupta',
    email: 'sunil@test.com',
    password: 'Password123!'
  });
  assert(v1.status === 400 && v1.data.message.includes('Store name is required'), 'Rejects vendor registration missing store name');

  // Test 2.2: Short storeName (<3 chars)
  const v2 = await request('/auth/register-vendor', 'POST', {
    storeName: 'AB',
    ownerName: 'Sunil Gupta',
    email: 'sunil@test.com',
    password: 'Password123!'
  });
  assert(v2.status === 400 && v2.data.message.includes('at least 3 characters'), 'Rejects short store name', v2.data.message);

  // Test 2.3: Weak vendor password
  const v3 = await request('/auth/register-vendor', 'POST', {
    storeName: 'Gupta Electronics',
    ownerName: 'Sunil Gupta',
    email: 'sunil@test.com',
    password: 'weak'
  });
  assert(v3.status === 400 && v3.data.message.includes('at least 8 characters'), 'Rejects weak vendor password', v3.data.message);

  // Test 2.4: Invalid primary color hex
  const v4 = await request('/auth/register-vendor', 'POST', {
    storeName: 'Gupta Electronics',
    ownerName: 'Sunil Gupta',
    email: 'sunil@test.com',
    password: 'Password123!',
    primaryColor: 'not-a-color'
  });
  assert(v4.status === 400 && v4.data.message.includes('valid hex color'), 'Rejects invalid hex color code', v4.data.message);

  // Test 2.5: Valid vendor registration
  const v5 = await request('/auth/register-vendor', 'POST', {
    storeName: `Zenith Timepieces ${randNum}`,
    ownerName: 'Sunil Gupta',
    email: `sunil${randNum}@zenithtime.com`,
    password: 'SuperSecureVendor123!',
    phone: '+919988776655',
    primaryColor: '#10b981',
    tagline: 'Precision crafted horology'
  });
  assert(v5.status === 201 && v5.data.token && v5.data.tenant.slug, 'Accepts valid vendor registration', v5.data.message);

  console.log('\n=========================================================');
  console.log(`📊 FINAL RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('=========================================================');
};

runValidationTests().catch(console.error);
