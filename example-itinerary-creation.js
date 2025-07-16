// Ví dụ tạo hành trình cho Tour "Tour du lịch Đà Lạt 4N3Đ"
// Tour ID: "2"

const exampleItineraryData = [
  {
    tour_id: "2",
    day_number: 1,
    title: "Ngày 1: TP.HCM - Đà Lạt",
    description: "Khởi hành từ TP.HCM đi Đà Lạt. Nhận phòng khách sạn, nghỉ ngơi. Chiều tham quan chợ Đà Lạt và dạo quanh hồ Xuân Hương.",
    location_ids: [
      // Cần có location_id của Đà Lạt, chợ Đà Lạt, hồ Xuân Hương
      // Ví dụ: ["location-dalat-center", "location-dalat-market", "location-xuan-huong-lake"]
    ]
  },
  {
    tour_id: "2",
    day_number: 2,
    title: "Ngày 2: Khám phá thiên nhiên Đà Lạt",
    description: "Tham quan thác Elephant, vườn hoa Đà Lạt, làng Cù Lần. Trải nghiệm cưỡi đà điểu, cho nai ăn.",
    location_ids: [
      // Cần có location_id của thác Elephant, vườn hoa, làng Cù Lần
      // Ví dụ: ["location-elephant-falls", "location-dalat-flower-garden", "location-cu-lan-village"]
    ]
  },
  {
    tour_id: "2",
    day_number: 3,
    title: "Ngày 3: Tham quan di tích lịch sử",
    description: "Ghé thăm dinh Bảo Đại, nhà thờ Domain de Marie, ga Đà Lạt. Tự do mua sắm đặc sản.",
    location_ids: [
      // Cần có location_id của dinh Bảo Đại, nhà thờ, ga Đà Lạt
      // Ví dụ: ["location-bao-dai-palace", "location-domain-de-marie", "location-dalat-station"]
    ]
  },
  {
    tour_id: "2",
    day_number: 4,
    title: "Ngày 4: Đà Lạt - TP.HCM",
    description: "Ăn sáng tại khách sạn. Tham quan vài điểm cuối cùng, mua sắm. Khởi hành về TP.HCM.",
    location_ids: [
      // Có thể để trống hoặc thêm location cuối cùng
    ]
  }
];

// Cách sử dụng API để tạo hành trình:

/*
1. Tạo từng itinerary:
POST /api/itineraries
Body: {
  "tour_id": "2",
  "day_number": 1,
  "title": "Ngày 1: TP.HCM - Đà Lạt",
  "description": "Khởi hành từ TP.HCM đi Đà Lạt...",
  "location_ids": ["location-id-1", "location-id-2"]
}

2. Lấy hành trình theo tour:
GET /api/itineraries/tour/2

3. Cập nhật hành trình:
PUT /api/itineraries/:itinerary_id
Body: {
  "title": "Tiêu đề mới",
  "description": "Mô tả mới",
  "location_ids": ["location-id-1", "location-id-2", "location-id-3"]
}

4. Thêm locations vào hành trình:
POST /api/itineraries/:itinerary_id/locations
Body: {
  "location_ids": ["location-id-4", "location-id-5"]
}

5. Xóa locations khỏi hành trình:
DELETE /api/itineraries/:itinerary_id/locations
Body: {
  "location_ids": ["location-id-4"]
}
*/

module.exports = exampleItineraryData;
