const { sequelize, Agency, Tour, DepartureDate, Itinerary, User } = require('./models');

async function createTestDataForAgency2() {
  try {
    console.log('🚀 Bắt đầu tạo dữ liệu test cho Agency 2...');
    
    // 1. Tìm agency thứ 2
    const agency2UserId = '855ff6be-bed7-497c-84e0-4230faa2c61a';
    
    let agency2 = await Agency.findOne({ where: { user_id: agency2UserId } });
    
    if (!agency2) {
      console.log('❌ Không tìm thấy Agency 2, tạo mới...');
      
      // Tạo user nếu chưa có
      let user2 = await User.findByPk(agency2UserId);
      if (!user2) {
        user2 = await User.create({
          id: agency2UserId,
          name: 'Agency Test 2',
          email: 'agency2@test.com',
          password: 'hashed_password', // Trong thực tế cần hash
          role: 'agency',
          is_approved: true
        });
        console.log('✅ Đã tạo User cho Agency 2');
      }
      
      // Tạo agency
      agency2 = await Agency.create({
        user_id: agency2UserId,
        name: 'Du Lịch ABC Travel',
        license_number: 'LIC-ABC-2024',
        contact_person: 'Nguyễn Văn B',
        phone: '0987654321',
        email: 'contact@abctravel.com',
        address: '456 Đường DEF, Quận 2, TP.HCM',
        is_approved: true
      });
      console.log('✅ Đã tạo Agency 2:', agency2.id);
    }
    
    console.log('📋 Agency 2 Info:', {
      id: agency2.id,
      name: agency2.name,
      user_id: agency2.user_id
    });
    
    // 2. Tạo tour cho agency 2
    const tour2 = await Tour.create({
      name: 'Tour Phú Quốc 4N3Đ - Thiên Đường Biển Đảo',
      slug: 'tour-phu-quoc-4n3d-thien-duong-bien-dao',
      description: 'Khám phá vẻ đẹp hoang sơ của đảo ngọc Phú Quốc với những bãi biển tuyệt đẹp',
      destination: 'Phú Quốc, Kiên Giang',
      duration_days: 4,
      duration_nights: 3,
      price: 4500000,
      max_participants: 25,
      agency_id: agency2.id,
      category_id: 1,
      is_active: true
    });
    
    console.log('✅ Đã tạo Tour cho Agency 2:', {
      id: tour2.id,
      name: tour2.name,
      agency_id: tour2.agency_id
    });
    
    // 3. Tạo departure dates cho tour
    const departureDates = [
      { date: '2025-08-15', available_slots: 25 },
      { date: '2025-08-20', available_slots: 25 },
      { date: '2025-08-25', available_slots: 25 },
      { date: '2025-09-01', available_slots: 25 },
      { date: '2025-09-10', available_slots: 25 }
    ];
    
    for (const depDate of departureDates) {
      await DepartureDate.create({
        tour_id: tour2.id,
        departure_date: depDate.date,
        available_slots: depDate.available_slots,
        booked_slots: 0
      });
    }
    
    console.log(`✅ Đã tạo ${departureDates.length} departure dates cho Agency 2`);
    
    // 4. Tạo itinerary cho tour
    const itineraryData = [
      {
        day_number: 1,
        title: 'Ngày 1: TP.HCM - Phú Quốc - Check in Resort',
        description: 'Bay từ TP.HCM đến Phú Quốc, đón tại sân bay, check-in resort, tự do nghỉ ngơi'
      },
      {
        day_number: 2,
        title: 'Ngày 2: Khám phá Nam đảo - Cáp treo Hòn Thơm',
        description: 'Tham quan cáp treo Hòn Thơm, Sun World, bãi biển Sao, làng chài Hàm Ninh'
      },
      {
        day_number: 3,
        title: 'Ngày 3: Tour Bắc đảo - Nhà thùng Sao Biển',
        description: 'Tham quan nhà thùng nuôi cá, câu cá, lặn ngắm san hô, ăn trưa trên biển'
      },
      {
        day_number: 4,
        title: 'Ngày 4: Tự do mua sắm - Ra sân bay',
        description: 'Tự do mua sắm đặc sản, check-out khách sạn, đưa ra sân bay về TP.HCM'
      }
    ];
    
    for (const itinerary of itineraryData) {
      await Itinerary.create({
        tour_id: tour2.id,
        day_number: itinerary.day_number,
        title: itinerary.title,
        description: itinerary.description
      });
    }
    
    console.log(`✅ Đã tạo ${itineraryData.length} itinerary items cho Agency 2`);
    
    // 5. Tạo thêm 1 tour nữa cho Agency 2
    const tour2b = await Tour.create({
      name: 'Tour Đà Lạt 3N2Đ - Thành Phố Ngàn Hoa',
      slug: 'tour-da-lat-3n2d-thanh-pho-ngan-hoa',
      description: 'Khám phá vẻ đẹp thơ mộng của Đà Lạt với khí hậu mát mẻ quanh năm',
      destination: 'Đà Lạt, Lâm Đồng',
      duration_days: 3,
      duration_nights: 2,
      price: 2800000,
      max_participants: 30,
      agency_id: agency2.id,
      category_id: 1,
      is_active: true
    });
    
    console.log('✅ Đã tạo Tour thứ 2 cho Agency 2:', {
      id: tour2b.id,
      name: tour2b.name,
      agency_id: tour2b.agency_id
    });
    
    // Tạo departure dates cho tour Đà Lạt
    const dallatDepartures = [
      { date: '2025-08-18', available_slots: 30 },
      { date: '2025-08-28', available_slots: 30 },
      { date: '2025-09-05', available_slots: 30 }
    ];
    
    for (const depDate of dallatDepartures) {
      await DepartureDate.create({
        tour_id: tour2b.id,
        departure_date: depDate.date,
        available_slots: depDate.available_slots,
        booked_slots: 0
      });
    }
    
    console.log(`✅ Đã tạo ${dallatDepartures.length} departure dates cho tour Đà Lạt`);
    
    // 6. Tóm tắt kết quả
    console.log('\n🎉 HOÀN THÀNH TẠO DỮ LIỆU TEST!');
    console.log('=====================================');
    console.log(`✅ Agency 2 ID: ${agency2.id}`);
    console.log(`✅ User ID: ${agency2.user_id}`);
    console.log(`✅ Số tour đã tạo: 2`);
    console.log(`✅ Tổng departure dates: ${departureDates.length + dallatDepartures.length}`);
    console.log(`✅ Tổng itinerary items: ${itineraryData.length}`);
    
    console.log('\n🧪 Bây giờ có thể test với:');
    console.log(`- Agency 1 (${agency2UserId}): sẽ thấy dữ liệu mới tạo`);
    console.log(`- Agency 2 (d3a463c7-fa0f-486c-8b89-8429c5640186): sẽ thấy dữ liệu cũ`);
    
  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu test:', error);
  } finally {
    await sequelize.close();
  }
}

// Chạy script
createTestDataForAgency2();
