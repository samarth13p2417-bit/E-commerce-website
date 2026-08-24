const https = require('https');
const http = require('http');

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(checkUrl(res.headers.location));
        }
        resolve({ url, statusCode: res.statusCode, contentType: res.headers['content-type'] });
      });
      req.on('error', (err) => resolve({ url, error: err.message }));
      req.setTimeout(8000, () => {
        req.destroy();
        resolve({ url, error: 'Timeout' });
      });
    } catch (e) {
      resolve({ url, error: e.message });
    }
  });
}

function getJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data || '{}')));
    }).on('error', reject);
  });
}

(async () => {
  const tenantsRes = await getJson('http://localhost:5000/api/tenants');
  const tenants = tenantsRes.data;
  console.log(`Found ${tenants.length} tenants. Testing all product images...\n`);

  const failed = [];
  let totalProducts = 0;

  for (const t of tenants) {
    console.log(`\n=== Store: ${t.name} (/${t.slug}) ===`);
    const pRes = await getJson(`http://localhost:5000/api/products?tenant=${t._id}`);
    const products = pRes.data || [];
    totalProducts += products.length;

    for (const p of products) {
      const img = p.images && p.images[0];
      if (!img) {
        console.log(`❌ [NO IMAGE] ${p.name}`);
        failed.push({ tenant: t.name, product: p.name, reason: 'Missing image' });
        continue;
      }
      const result = await checkUrl(img);
      if (result.statusCode === 200 && result.contentType && result.contentType.startsWith('image')) {
        console.log(`✅ OK: ${p.name}`);
      } else {
        console.log(`❌ FAIL [Status: ${result.statusCode || result.error}] ${p.name} -> ${img}`);
        failed.push({ tenant: t.name, product: p.name, img, result });
      }
    }
  }

  console.log('\n======================================');
  console.log(`Total Products Tested: ${totalProducts}`);
  console.log(`Total Image Failures: ${failed.length}`);
  console.log('======================================');

  if (failed.length > 0) {
    console.log('\nFailed Items:');
    console.log(JSON.stringify(failed, null, 2));
  }
})();
