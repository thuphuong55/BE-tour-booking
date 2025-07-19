const { Location, Destination } = require('./models');

async function checkLocations() {
  try {
    console.log('📍 Available Locations:');
    console.log('=' .repeat(50));
    
    const locations = await Location.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    
    if (locations.length === 0) {
      console.log('❌ No locations found in database');
      console.log('\n💡 You need to create locations first before assigning them to destinations');
      return;
    }
    
    locations.forEach((location, index) => {
      console.log(`${index + 1}. ${location.name}`);
      console.log(`   ID: ${location.id}`);
      console.log('');
    });
    
    console.log(`Total locations: ${locations.length}`);
    
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
    const locations = await Location.findAll();
    console.log('Số lượng locations:', locations.length);
    
    if (locations.length > 0) {
      console.log('\nDanh sách locations:');
      locations.forEach(loc => {
        console.log(`- ${loc.name} (ID: ${loc.id}, destination_id: ${loc.destination_id || 'NULL'})`);
      });
    } else {
      console.log('Không có locations nào trong database');
    }

    console.log('\n=== Kiểm tra dữ liệu Destinations ===');
    const destinations = await Destination.findAll({
      include: [{
        model: Location,
        as: 'locations',
        attributes: ['id', 'name']
      }]
    });
    
    console.log('Số lượng destinations:', destinations.length);
    destinations.forEach(dest => {
      console.log(`- ${dest.name} (ID: ${dest.id}): ${dest.locations.length} locations`);
      if (dest.locations.length > 0) {
        dest.locations.forEach(loc => {
          console.log(`  + ${loc.name}`);
        });
      }
    });

  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    process.exit();
  }
}

checkLocations(); 