// Script tạo hành trình mẫu cho Tour Đà Lạt (ID: "2")
const { Itinerary } = require('./models');

async function createSampleItinerary() {
  try {
    const tourId = "2"; // Tour du lịch Đà Lạt 4N3Đ
    const dalatLocationId = "61d461a7-c081-4585-869e-063f09cdb60e"; // Đà Lạt location

    console.log('Tạo hành trình mẫu cho Tour Đà Lạt...');

    // Ngày 1
    const day1 = await Itinerary.create({
      tour_id: tourId,
      day_number: 1,
      title: "Ngày 1: TP.HCM - Đà Lạt",
      description: "Khởi hành từ TP.HCM đi Đà Lạt bằng xe khách hoặc máy bay. Nhận phòng khách sạn, nghỉ ngơi. Chiều tham quan chợ Đà Lạt và dạo quanh hồ Xuân Hương."
    });
    
    // Thêm location Đà Lạt vào ngày 1
    await day1.setLocations([dalatLocationId]);
    console.log('✓ Đã tạo ngày 1:', day1.title);

    // Ngày 2
    const day2 = await Itinerary.create({
      tour_id: tourId,
      day_number: 2,
      title: "Ngày 2: Khám phá thiên nhiên Đà Lạt",
      description: "Tham quan thác Elephant, vườn hoa Đà Lạt, làng Cù Lần. Trải nghiệm cưỡi đà điểu, cho nai ăn tại trang trại. Chiều thăm quan dinh Bảo Đại."
    });
    
    await day2.setLocations([dalatLocationId]);
    console.log('✓ Đã tạo ngày 2:', day2.title);

    // Ngày 3
    const day3 = await Itinerary.create({
      tour_id: tourId,
      day_number: 3,
      title: "Ngày 3: Tham quan di tích lịch sử",
      description: "Ghé thăm nhà thờ Domain de Marie, ga Đà Lạt, crazy house. Tự do mua sắm đặc sản như atiso, socola, mứt dâu tằm, cà phê Đà Lạt."
    });
    
    await day3.setLocations([dalatLocationId]);
    console.log('✓ Đã tạo ngày 3:', day3.title);

    // Ngày 4
    const day4 = await Itinerary.create({
      tour_id: tourId,
      day_number: 4,
      title: "Ngày 4: Đà Lạt - TP.HCM",
      description: "Ăn sáng tại khách sạn. Tham quan vài điểm cuối cùng, mua sắm đặc sản. Khởi hành về TP.HCM. Kết thúc chuyến du lịch."
    });
    
    await day4.setLocations([dalatLocationId]);
    console.log('✓ Đã tạo ngày 4:', day4.title);

    console.log('\n🎉 Đã tạo xong hành trình mẫu cho Tour Đà Lạt!');
    console.log('Sử dụng API GET /api/itineraries/tour/2 để xem kết quả');

  } catch (error) {
    console.error('Lỗi khi tạo hành trình:', error);
  }
}

// Chạy script
createSampleItinerary();
