const { Hotel, Location } = require('./models');

async function testHotelLocationRelationship() {
  try {
    console.log('🏨 Test quan hệ Hotel - Location...\n');
    
    // 1. Lấy danh sách location
    console.log('1. Danh sách địa điểm:');
    const locations = await Location.findAll({
      attributes: ['id', 'name']
    });
    locations.forEach(location => {
      console.log(`   - ${location.name} (${location.id})`);
    });
    
    // 2. Lấy danh sách hotel
    console.log('\n2. Danh sách khách sạn:');
    const hotels = await Hotel.findAll({
      attributes: ['id_hotel', 'ten_khach_san', 'location_id']
    });
    hotels.forEach(hotel => {
      console.log(`   - ${hotel.ten_khach_san} (${hotel.id_hotel}) - Location: ${hotel.location_id || 'Chưa gán'}`);
    });
    
    // 3. Gán location cho một khách sạn để test
    if (hotels.length > 0 && locations.length > 0) {
      const firstHotel = hotels[0];
      const firstLocation = locations[0];
      
      console.log(`\n3. Gán khách sạn "${firstHotel.ten_khach_san}" vào địa điểm "${firstLocation.name}"`);
      
      await firstHotel.update({
        location_id: firstLocation.id
      });
      
      console.log('✅ Gán thành công!');
    }
    
    // 4. Test query với join
    console.log('\n4. Lấy khách sạn kèm thông tin địa điểm:');
    const hotelsWithLocation = await Hotel.findAll({
      include: [{
        model: Location,
        as: 'location',
        attributes: ['id', 'name', 'description']
      }],
      limit: 3
    });
    
    hotelsWithLocation.forEach(hotel => {
      const locationName = hotel.location ? hotel.location.name : 'Chưa gán địa điểm';
      console.log(`   - ${hotel.ten_khach_san} tại ${locationName}`);
    });
    
    // 5. Test lọc khách sạn theo địa điểm
    if (locations.length > 0) {
      const testLocation = locations[0];
      console.log(`\n5. Lọc khách sạn tại "${testLocation.name}"`);
      
      const hotelsByLocation = await Hotel.findAll({
        where: { location_id: testLocation.id },
        include: [{
          model: Location,
          as: 'location',
          attributes: ['id', 'name']
        }]
      });
      
      console.log(`   Tìm thấy ${hotelsByLocation.length} khách sạn:`)
      hotelsByLocation.forEach(hotel => {
        console.log(`   - ${hotel.ten_khach_san}`);
      });
    }
    
    console.log('\n✅ Test hoàn thành! Quan hệ Hotel-Location hoạt động tốt.');
    
  } catch (error) {
    console.error('❌ Lỗi trong test:', error.message);
  } finally {
    process.exit();
  }
}

testHotelLocationRelationship();
