const { Itinerary, Location } = require('./models');

async function testGetItinerariesByTour() {
  try {
    console.log('=== TEST: Lấy hành trình theo tour ID = "2" ===');
    
    const itineraries = await Itinerary.findAll({
      where: { tour_id: "2" },
      include: [
        {
          model: Location,
          as: 'locations',
          attributes: ['id', 'name']
        }
      ],
      order: [['day_number', 'ASC']]
    });

    console.log(`Tìm thấy ${itineraries.length} hành trình:`);
    
    itineraries.forEach(itinerary => {
      console.log(`\n--- Ngày ${itinerary.day_number} ---`);
      console.log(`ID: ${itinerary.id}`);
      console.log(`Tiêu đề: ${itinerary.title}`);
      console.log(`Mô tả: ${itinerary.description}`);
      console.log(`Locations: ${itinerary.locations.map(loc => loc.name).join(', ')}`);
    });

    console.log('\n✅ Test thành công!');
    
  } catch (error) {
    console.error('❌ Lỗi test:', error);
  }
}

testGetItinerariesByTour();
