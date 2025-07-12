const { Location, Destination } = require('./models');

async function checkLocations() {
  try {
    console.log('=== Kiểm tra dữ liệu Locations ===');
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