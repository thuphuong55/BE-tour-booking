const { Location, Destination } = require('./models');

async function checkLocationDestinationData() {
  try {
    const locations = await Location.findAll({
      include: [{
        model: Destination,
        as: 'destinations',
        attributes: ['id', 'name']
      }]
    });
    console.log('=== Danh sách Location và các Destination thuộc về nó ===');
    locations.forEach(loc => {
      console.log(`- ${loc.name} (ID: ${loc.id}):`);
      if (loc.destinations.length === 0) {
        console.log('  (Không có destination nào)');
      } else {
        loc.destinations.forEach(dest => {
          console.log(`  + ${dest.name} (ID: ${dest.id})`);
        });
      }
    });
  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    process.exit();
  }
}

checkLocationDestinationData(); 