// Production Environment Check Script
const https = require('https');

const API_BASE_URL = 'https://api.kidpath.me';

// Test CORS configuration
function testCORS() {
  console.log('🔍 Testing CORS configuration...');
  
  const options = {
    hostname: 'api.kidpath.me',
    port: 443,
    path: '/api/v1/geojson/parks',
    method: 'GET',
    headers: {
      'Origin': 'https://www.kidpath.me',
      'User-Agent': 'KidPath-Production-Check'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`✅ CORS Headers:`);
    console.log(`   Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
    console.log(`   Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods']}`);
    console.log(`   Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials']}`);
    
    if (res.statusCode === 200) {
      console.log('🎉 CORS configuration is working correctly!');
    } else {
      console.log('❌ CORS configuration needs attention.');
    }
  });

  req.on('error', (error) => {
    console.error('❌ Error testing CORS:', error.message);
  });

  req.end();
}

// Test API endpoints
function testEndpoints() {
  console.log('🔍 Testing API endpoints...');
  
  const endpoints = [
    '/api/v1/geojson/parks',
    '/api/v1/geojson/trees',
    '/api/v1/geojson/grass',
    '/api/v1/amenities/nearby?lat=-37.8136&lon=144.9631&radius=1000',
    '/api/v1/amenities/bbox?bbox=144.9,-37.9,145.0,-37.8',
    '/api/v1/amenities/search?name=park'
  ];

  endpoints.forEach(endpoint => {
    const options = {
      hostname: 'api.kidpath.me',
      port: 443,
      path: endpoint,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      console.log(`${res.statusCode === 200 ? '✅' : '❌'} ${endpoint} - ${res.statusCode}`);
    });

    req.on('error', (error) => {
      console.error(`❌ ${endpoint} - Error: ${error.message}`);
    });

    req.end();
  });
}

// Run tests
console.log('🚀 Starting production environment check...\n');
testCORS();
setTimeout(() => {
  console.log('\n');
  testEndpoints();
}, 2000);
