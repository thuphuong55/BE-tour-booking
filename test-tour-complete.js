const { Tour, DepartureDate, TourImage, IncludedService, TourCategory, Hotel, ExcludedService, Itinerary, Location } = require('./models');

async function testGetTourComplete() {
  try {
    console.log('=== TEST: Lấy thông tin tour complete với itineraries ===');
    
    const tour = await Tour.findByPk("2", {
      include: [
        {
          model: DepartureDate,
          as: 'departureDates',
          attributes: [
            ['id', 'departureDates_id'],
            'departure_date',
            'end_date',
            'number_of_days',
            'number_of_nights'
          ]
        },
        {
          model: TourImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main']
        },
        {
          model: IncludedService,
          as: "includedServices",
          attributes: ['id', 'name']
        },
        {
          model: ExcludedService,
          as: "excludedServices",
          attributes: ['id', 'service_name']
        },
        {
          model: TourCategory,
          as: "categories",
          attributes: ['id', 'name']
        },
        {
          model: Hotel,
          as: "hotels",
          attributes: ['id_hotel', 'ten_khach_san', 'ten_phong', 'star_rating']
        },
        {
          model: Itinerary,
          as: "itineraries",
          attributes: ['id', 'day_number', 'title', 'description'],
          include: [
            {
              model: Location,
              as: "locations",
              attributes: ['id', 'name'],
              through: { attributes: [] }
            }
          ]
        }
      ],
      order: [
        [{ model: Itinerary, as: "itineraries" }, 'day_number', 'ASC']
      ]
    });

    if (!tour) {
      console.log('❌ Không tìm thấy tour với ID = "2"');
      return;
    }

    console.log(`✅ Tìm thấy tour: ${tour.name}`);
    console.log(`📅 Số hành trình: ${tour.itineraries.length}`);
    
    if (tour.itineraries.length > 0) {
      console.log('\n--- HÀNH TRÌNH ---');
      tour.itineraries.forEach(itinerary => {
        console.log(`Ngày ${itinerary.day_number}: ${itinerary.title}`);
        console.log(`  - Mô tả: ${itinerary.description.substring(0, 80)}...`);
        if (itinerary.locations && itinerary.locations.length > 0) {
          console.log(`  - Địa điểm: ${itinerary.locations.map(loc => loc.name).join(', ')}`);
        }
        console.log('');
      });
    } else {
      console.log('⚠️ Tour chưa có hành trình nào');
    }

    console.log('\n✅ Test hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi test:', error);
  }
}

testGetTourComplete();
