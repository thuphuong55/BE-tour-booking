const fs = require('fs');

try {
  console.log('🎯 TOP SEARCH DESTINATIONS WITH TOURS');
  console.log('======================================\n');

  // Load destinations data
  const destinationsData = JSON.parse(fs.readFileSync('top-destinations-response.json', 'utf8'));
  
  console.log('📍 TOP DESTINATIONS:');
  destinationsData.destinations.forEach((destination, index) => {
    console.log(`${index + 1}. 🏛️  ${destination.name}`);
    console.log(`   📍 Location: ${destination.location.name}`);
    console.log(`   🖼️  Image: ${destination.image || 'No image'}`);
    console.log(`   🏨 Tours found: ${destination.tours.length}`);
    
    if (destination.tours.length > 0) {
      destination.tours.forEach((tour, tourIndex) => {
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
  
  const totalDestinations = destinationsData.destinations.length;
  const totalTours = destinationsData.destinations.reduce((sum, dest) => sum + dest.tours.length, 0);
  console.log(`📊 Summary: ${totalDestinations} destinations, ${totalTours} total tours`);

  console.log('\n' + '='.repeat(50));
  
  // Load locations data for comparison
  if (fs.existsSync('top-search-response.json')) {
    const locationsData = JSON.parse(fs.readFileSync('top-search-response.json', 'utf8'));
    console.log('\n🏞️  COMPARISON - TOP LOCATIONS:');
    locationsData.locations.forEach((location, index) => {
      console.log(`${index + 1}. ${location.name} - ${location.tours.length} tours`);
    });
    
    const totalLocations = locationsData.locations.length;
    const totalLocationTours = locationsData.locations.reduce((sum, loc) => sum + loc.tours.length, 0);
    console.log(`📊 Locations Summary: ${totalLocations} locations, ${totalLocationTours} total tours`);
  }
  
} catch (error) {
  console.error('Error:', error.message);
}
