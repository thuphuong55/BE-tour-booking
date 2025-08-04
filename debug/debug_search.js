const { Location, Tour, sequelize } = require('./models');
const { Op } = require('sequelize');

async function debugSearch() {
  try {
    console.log('=== CHECKING ALL LOCATIONS FOR TOURS ===\n');
    
    const locations = await Location.findAll({
      attributes: ["id", "name"],
      order: [['name', 'ASC']]
    });

    console.log(`Found ${locations.length} total locations in database:`);
    locations.forEach((loc, i) => {
      console.log(`${i+1}. ${loc.name} (${loc.id})`);
    });
    console.log('');

    // Check tours for each location
    for (const location of locations) {
      console.log(`🔍 Checking tours for location: ${location.name}`);
      
      const tours = await Tour.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                { status: 'Đang hoạt động' },
                { status: '' },
                { status: null }
              ]
            },
            {
              [Op.or]: [
                sequelize.where(
                  sequelize.fn('LOWER', sequelize.col('location')), 
                  'LIKE', 
                  `%${location.name.toLowerCase()}%`
                ),
                sequelize.where(
                  sequelize.fn('LOWER', sequelize.col('destination')), 
                  'LIKE', 
                  `%${location.name.toLowerCase()}%`
                )
              ]
            }
          ]
        },
        attributes: ['id', 'name', 'location', 'destination', 'status']
      });

      console.log(`📊 Location ${location.name}: ${tours.length} tours found`);
      
      if (tours.length > 0) {
        tours.forEach((tour, i) => {
          console.log(`   ${i+1}. "${tour.name}" | Location: "${tour.location}" | Destination: "${tour.destination || 'N/A'}" | Status: "${tour.status || 'EMPTY'}"`);
        });
      } else {
        console.log('   ❌ No tours found for this location');
      }
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugSearch();
