# Tài liệu API Itinerary (Hành trình Tour)

## Tổng quan
Hệ thống itinerary cho phép tạo và quản lý hành trình cho từng tour, bao gồm các ngày và địa điểm tham quan.

## Cấu trúc Database

### Bảng `itinerary`
- `id`: UUID - Primary key
- `tour_id`: UUID - Foreign key đến bảng tours
- `day_number`: INTEGER - Số thứ tự ngày (1, 2, 3, 4...)
- `title`: STRING - Tiêu đề ngày (VD: "Ngày 1: TP.HCM - Đà Lạt")
- `description`: TEXT - Mô tả chi tiết hoạt động trong ngày

### Quan hệ
- `Itinerary` belongsTo `Tour` (1 hành trình thuộc 1 tour)
- `Itinerary` belongsToMany `Location` (1 hành trình có nhiều địa điểm)

## API Endpoints

### 1. Lấy tất cả hành trình
```
GET /api/itineraries
```
**Response:**
```json
{
  "message": "Lấy danh sách hành trình thành công",
  "data": [
    {
      "id": "uuid-here",
      "tour_id": "2",
      "day_number": 1,
      "title": "Ngày 1: TP.HCM - Đà Lạt",
      "description": "Khởi hành từ TP.HCM...",
      "tour": {
        "id": "2",
        "name": "Tour du lịch Đà Lạt 4N3Đ"
      },
      "locations": [
        {
          "id": "61d461a7-c081-4585-869e-063f09cdb60e",
          "name": "Đà Lạt"
        }
      ]
    }
  ]
}
```

### 2. Lấy hành trình theo Tour ID
```
GET /api/itineraries/tour/:tourId
```
**Ví dụ:** `GET /api/itineraries/tour/2`

### 3. Lấy 1 hành trình theo ID
```
GET /api/itineraries/:id
```

### 4. Tạo hành trình mới
```
POST /api/itineraries
Content-Type: application/json

{
  "tour_id": "2",
  "day_number": 1,
  "title": "Ngày 1: TP.HCM - Đà Lạt",
  "description": "Khởi hành từ TP.HCM đi Đà Lạt...",
  "location_ids": ["61d461a7-c081-4585-869e-063f09cdb60e"]
}
```

### 5. Cập nhật hành trình
```
PUT /api/itineraries/:id
Content-Type: application/json

{
  "title": "Ngày 1: TP.HCM - Đà Lạt (Cập nhật)",
  "description": "Mô tả mới...",
  "location_ids": ["location-id-1", "location-id-2"]
}
```

### 6. Xóa hành trình
```
DELETE /api/itineraries/:id
```

### 7. Thêm địa điểm vào hành trình
```
POST /api/itineraries/:id/locations
Content-Type: application/json

{
  "location_ids": ["location-id-3", "location-id-4"]
}
```

### 8. Xóa địa điểm khỏi hành trình
```
DELETE /api/itineraries/:id/locations
Content-Type: application/json

{
  "location_ids": ["location-id-3"]
}
```

## Lấy Tour với Hành trình

### Endpoint getTourComplete
```
GET /api/tours/:id/complete
```

**Response bao gồm:**
- Thông tin tour cơ bản
- Departure dates
- Images
- Included/Excluded services
- Categories
- Hotels
- **Itineraries** (với locations)

**Ví dụ response:**
```json
{
  "id": "2",
  "name": "Tour du lịch Đà Lạt 4N3Đ - Trải nghiệm ngàn hoa",
  "description": "Khám phá vẻ đẹp thơ mộng của Đà Lạt...",
  "itineraries": [
    {
      "id": "itinerary-uuid",
      "day_number": 1,
      "title": "Ngày 1: TP.HCM - Đà Lạt",
      "description": "Khởi hành từ TP.HCM...",
      "locations": [
        {
          "id": "61d461a7-c081-4585-869e-063f09cdb60e",
          "name": "Đà Lạt"
        }
      ]
    },
    {
      "id": "itinerary-uuid-2",
      "day_number": 2,
      "title": "Ngày 2: Khám phá thiên nhiên Đà Lạt",
      "description": "Tham quan thác Elephant...",
      "locations": [
        {
          "id": "61d461a7-c081-4585-869e-063f09cdb60e",
          "name": "Đà Lạt"
        }
      ]
    }
  ]
}
```

## Validation Rules

1. **tour_id**: Bắt buộc, phải tồn tại trong bảng tours
2. **day_number**: Bắt buộc, phải là số nguyên dương
3. **title**: Bắt buộc
4. **location_ids**: Optional, nhưng nếu có thì tất cả ID phải tồn tại

## Ví dụ sử dụng từ Frontend

```javascript
// 1. Tạo hành trình mới
const createItinerary = async (tourId, dayData) => {
  const response = await fetch('/api/itineraries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tour_id: tourId,
      day_number: dayData.dayNumber,
      title: dayData.title,
      description: dayData.description,
      location_ids: dayData.selectedLocations
    })
  });
  return response.json();
};

// 2. Lấy hành trình theo tour
const getItinerariesByTour = async (tourId) => {
  const response = await fetch(`/api/itineraries/tour/${tourId}`);
  return response.json();
};

// 3. Lấy tour với hành trình đầy đủ
const getTourWithItineraries = async (tourId) => {
  const response = await fetch(`/api/tours/${tourId}/complete`);
  return response.json();
};
```

## Lưu ý quan trọng

1. **Thứ tự ngày**: Các hành trình được sắp xếp theo `day_number` tăng dần
2. **Location liên kết**: Sử dụng bảng trung gian `itinerary_location`
3. **Cascade delete**: Khi xóa itinerary, các liên kết với location cũng bị xóa
4. **Validation**: Hệ thống kiểm tra tồn tại của tour_id và location_ids trước khi tạo

## Status hiện tại

✅ **Đã hoàn thành:**
- Model Itinerary với đầy đủ associations
- Controller với CRUD operations
- Routes đầy đủ
- Integration với Tour controller
- Tạo dữ liệu mẫu cho Tour Đà Lạt

✅ **Đã test:**
- Tạo hành trình thành công
- Lấy hành trình theo tour hoạt động
- Tour complete endpoint trả về đầy đủ hành trình với locations

**Kết luận:** Hệ thống itinerary đã hoàn toàn ready để Frontend tích hợp!
