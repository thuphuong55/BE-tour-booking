const http = require('http');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function compareEndpoints() {
  try {
    console.log('🎯 SEARCH ENDPOINTS COMPARISON');
    console.log('==============================\n');

    // Test locations endpoint
    console.log('📍 Testing /api/search/top (locations):');
    const locationsData = await makeRequest('http://localhost:5000/api/search/top');
    locationsData.locations.forEach((location, index) => {
      console.log(`   ${index + 1}. ${location.name} - ${location.tours.length} tours`);
    });
    
    console.log('\n🏛️  Testing /api/search/top-destinations:');
    const destinationsData = await makeRequest('http://localhost:5000/api/search/top-destinations');
    destinationsData.destinations.forEach((destination, index) => {
      console.log(`   ${index + 1}. ${destination.name} (${destination.location.name}) - ${destination.tours.length} tours`);
    });

    console.log('\n📊 SUMMARY:');
    console.log(`   Locations: ${locationsData.locations.length} items, ${locationsData.locations.reduce((s,l) => s + l.tours.length, 0)} total tours`);
    console.log(`   Destinations: ${destinationsData.destinations.length} items, ${destinationsData.destinations.reduce((s,d) => s + d.tours.length, 0)} total tours`);
    
    console.log('\n✅ Both endpoints working successfully!');
    console.log('   - /api/search/top → Top locations with tours');
    console.log('   - /api/search/top-destinations → Top destinations with tours');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

compareEndpoints();
