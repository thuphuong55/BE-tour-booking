const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('top-search-response.json', 'utf8'));
  
  console.log('✅ TOP SEARCH LOCATIONS WITH TOURS:');
  console.log('======================================\n');
  
  data.locations.forEach((location, index) => {
    console.log(`${index + 1}. 📍 ${location.name}`);
    console.log(`   Tours found: ${location.tours.length}`);
    
    if (location.tours.length > 0) {
      location.tours.forEach((tour, tourIndex) => {
        console.log(`      ${tourIndex + 1}. ${tour.name}`);
        console.log(`         💰 Price: ${tour.price ? tour.price.toLocaleString() + ' VND' : 'N/A'}`);
        console.log(`         🖼️  Images: ${tour.images.length}`);
        console.log(`         📅 Departures: ${tour.departureDates.length}`);
      });
    } else {
      console.log('      ❌ No tours found');
    }
    console.log('');
  });
  
  const totalTours = data.locations.reduce((sum, loc) => sum + loc.tours.length, 0);
  console.log(`📊 Summary: ${data.locations.length} locations, ${totalTours} total tours`);
  
} catch (error) {
  console.error('Error:', error.message);
}
