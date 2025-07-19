# API HOTEL-LOCATION - Lọc Khách Sạn Theo Địa Điểm

## 🎯 Mục đích
API này cho phép người dùng lọc khách sạn theo địa điểm, giúp tìm kiếm khách sạn phù hợp khi đã chọn điểm đến du lịch.

## 📋 Danh sách API Endpoints

### 1. Lấy tất cả khách sạn với thông tin địa điểm
```http
GET /api/hotel-locations
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id_hotel": "82ef4246-1929-47fa-ad9c-cd03df3615c7",
      "ten_khach_san": "Khách sạn Mường Thanh Luxury",
      "ten_phong": "Phòng Deluxe",
      "loai_phong": "Superior",
      "location_id": "1cc63272-da3f-48b8-b197-199d6ec8a996",
      "location": {
        "id": "1cc63272-da3f-48b8-b197-199d6ec8a996",
        "name": "Phú Quốc",
        "description": "Đảo ngọc Phú Quốc với những bãi biển tuyệt đẹp..."
      }
    }
  ]
}
```

---

### 2. Lọc khách sạn theo địa điểm
```http
GET /api/hotel-locations/location/:locationId
```

**Parameters:**
- `locationId`: ID của địa điểm (UUID)

**Response:**
```json
{
  "success": true,
  "message": "Tìm thấy 2 khách sạn tại Đà Lạt",
  "data": {
    "location": {
      "id": "61d461a7-c081-4585-869e-063f09cdb60e",
      "name": "Đà Lạt",
      "description": "Thành phố ngàn hoa với khí hậu mát mẻ..."
    },
    "hotels": [
      {
        "id_hotel": "hotel-dalat-a",
        "ten_khach_san": "Khách sạn Mường Thanh Holiday Đà Lạt",
        "ten_phong": "Phòng Standard",
        "loai_phong": "Standard",
        "location_id": "61d461a7-c081-4585-869e-063f09cdb60e",
        "location": {
          "id": "61d461a7-c081-4585-869e-063f09cdb60e",
          "name": "Đà Lạt",
          "description": "Thành phố ngàn hoa với khí hậu mát mẻ..."
        }
      }
    ]
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Không tìm thấy địa điểm"
}
```

---

### 3. Gán địa điểm cho khách sạn
```http
PUT /api/hotel-locations/:hotelId/location
```

**Parameters:**
- `hotelId`: ID của khách sạn (UUID)

**Request Body:**
```json
{
  "location_id": "61d461a7-c081-4585-869e-063f09cdb60e"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cập nhật địa điểm cho khách sạn thành công",
  "data": {
    "id_hotel": "hotel-dalat-a",
    "ten_khach_san": "Khách sạn Mường Thanh Holiday Đà Lạt",
    "ten_phong": "Phòng Standard",
    "loai_phong": "Standard",
    "location_id": "61d461a7-c081-4585-869e-063f09cdb60e",
    "location": {
      "id": "61d461a7-c081-4585-869e-063f09cdb60e",
      "name": "Đà Lạt",
      "description": "Thành phố ngàn hoa với khí hậu mát mẻ..."
    }
  }
}
```

## 🗄️ Cấu trúc Database

### Bảng `hotels`
```sql
CREATE TABLE hotels (
  id_hotel CHAR(36) PRIMARY KEY,
  ten_khach_san VARCHAR(255) NOT NULL,
  ten_phong VARCHAR(255),
  loai_phong VARCHAR(255),
  location_id CHAR(36) NULL,
  createdAt DATETIME,
  updatedAt DATETIME,
  
  INDEX idx_hotels_location (location_id)
);
```

### Quan hệ Database
- **Hotel belongsTo Location**: Mỗi khách sạn thuộc về một địa điểm
- **Location hasMany Hotel**: Một địa điểm có thể có nhiều khách sạn
- **Foreign Key**: `hotels.location_id` → `location.id`
- **ON DELETE**: SET NULL (khi xóa location, hotels vẫn tồn tại nhưng location_id = null)

## 📱 Use Case - Ứng dụng Frontend

### 1. Trang Chọn Điểm Đến
```javascript
// Người dùng chọn điểm đến
const selectedLocationId = "61d461a7-c081-4585-869e-063f09cdb60e"; // Đà Lạt

// Lấy danh sách khách sạn tại điểm đến đó
const response = await fetch(`/api/hotel-locations/location/${selectedLocationId}`);
const data = await response.json();

console.log(`Tìm thấy ${data.data.hotels.length} khách sạn tại ${data.data.location.name}`);
```

### 2. Trang Danh Sách Khách Sạn
```javascript
// Hiển thị tất cả khách sạn với thông tin địa điểm
const response = await fetch('/api/hotel-locations');
const hotels = await response.json();

hotels.data.forEach(hotel => {
  const locationName = hotel.location ? hotel.location.name : 'Chưa xác định';
  console.log(`${hotel.ten_khach_san} - ${locationName}`);
});
```

## ⚡ Ưu điểm

1. **Tìm kiếm chính xác**: Lọc khách sạn theo điểm đến cụ thể
2. **Hiệu suất cao**: Index trên location_id để tăng tốc truy vấn
3. **Dữ liệu đầy đủ**: Include thông tin địa điểm trong response
4. **Linh hoạt**: Có thể gán/bỏ gán khách sạn với địa điểm
5. **Error handling**: Xử lý lỗi khi không tìm thấy dữ liệu

## 🔧 Cấu hình Model

### Hotel Model (`models/hotel.js`)
```javascript
Hotel.associate = (models) => {
  // Quan hệ với Location
  Hotel.belongsTo(models.Location, {
    foreignKey: "location_id",
    as: "location"
  });
};
```

### Location Model (`models/Location.js`)
```javascript
Location.associate = (models) => {
  // Quan hệ với Hotel
  Location.hasMany(models.Hotel, {
    foreignKey: "location_id",
    as: "hotels"
  });
};
```

---

✅ **Chức năng đã được triển khai hoàn chỉnh và test thành công!**
