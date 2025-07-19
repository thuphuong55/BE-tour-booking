const { Location } = require('./models');

async function listLocations() {
  try {
    console.log('📍 Available Locations:');
    console.log('='.repeat(50));
    
    const allLocations = await Location.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    
    if (allLocations.length === 0) {
      console.log('❌ No locations found in database');
      console.log('\n💡 You need to create locations first before assigning them to destinations');
      return;
    }
    
    allLocations.forEach((location, index) => {
      console.log(`${index + 1}. ${location.name}`);
      console.log(`   ID: ${location.id}`);
      console.log('');
    });
    
    console.log(`Total locations: ${allLocations.length}`);
    
    // Check problematic location_id
    const problemLocationId = '327331f8-b845-4040-9efc-20bbb04308e0';
    console.log('\n🔍 Checking problematic location_id:', problemLocationId);
    
    const problemLocation = await Location.findByPk(problemLocationId);
    if (problemLocation) {
      console.log('✅ Location exists:', problemLocation.name);
    } else {
      console.log('❌ Location does not exist');
      console.log('💡 Use one of the IDs above for destination.location_id');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

listLocations();
