const { Location, Destination } = require('./models');

async function checkLocations() {
  try {
    console.log('=== CHECKING LOCATIONS ===');
    const locations = await Location.findAll({
      attributes: ['id', 'name', 'description'],
      limit: 20
    });
    
    console.log('Locations found:', locations.length);
    locations.forEach(loc => {
      console.log(`- ID: ${loc.id} | Name: ${loc.name}`);
    });

    console.log('\n=== CHECKING DESTINATIONS ===');
    const destinations = await Destination.findAll({
      attributes: ['id', 'name', 'description'],
      limit: 20
    });
    
    console.log('Destinations found:', destinations.length);
    destinations.forEach(dest => {
      console.log(`- ID: ${dest.id} | Name: ${dest.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkLocations();
