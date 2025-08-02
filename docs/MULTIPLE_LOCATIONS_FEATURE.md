# Multiple Locations for Tours

## Mô tả
Tính năng này cho phép một tour có thể có nhiều điểm đến (locations) thay vì chỉ một điểm đến như trước đây.

## Thay đổi Database

### Bảng mới
- `tour_location`: Junction table cho quan hệ many-to-many giữa Tour và Location

### Columns
```sql
CREATE TABLE tour_location (
  id UUID PRIMARY KEY,
  tour_id UUID NOT NULL,
  location_id UUID NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(tour_id, location_id)
);
```

## API Changes

### Tạo Tour (POST /api/tours)

#### Format cũ (vẫn được support):
```json
{
  "name": "Tour Hà Nội",
  "location_id": "uuid-of-hanoi"
}
```

#### Format mới (multiple locations):
```json
{
  "name": "Tour Bắc Bộ",
  "location_ids": ["uuid-of-hanoi", "uuid-of-sapa", "uuid-of-halong"]
}
```

#### Format hybrid (support cả hai):
```json
{
  "name": "Tour Toàn Quốc",
  "location_id": "uuid-of-hanoi",
  "location_ids": ["uuid-of-sapa", "uuid-of-halong"]
}
```

### Cập nhật Tour (PUT /api/tours/:id)

Tương tự như tạo tour, support cả `location_id` và `location_ids`.

### Response Format

Khi lấy tour (GET /api/tours/:id), response sẽ bao gồm:

```json
{
  "id": "tour-uuid",
  "name": "Tour Bắc Bộ",
  "location": "Hà Nội", // backward compatibility
  "locations": [
    {
      "id": "uuid-of-hanoi",
      "name": "Hà Nội"
    },
    {
      "id": "uuid-of-sapa", 
      "name": "Sa Pa"
    }
  ]
}
```

## New API Endpoints

### 1. Lấy tour với locations
```
GET /api/tours/:id/locations
```

### 2. Gán location cho tour
```
POST /api/tours/:tourId/locations/:locationId
```

### 3. Gỡ location khỏi tour
```
DELETE /api/tours/:tourId/locations/:locationId
```

## Backward Compatibility

- Trường `location` (string) vẫn được giữ lại để tương thích với code cũ
- Khi có multiple locations, trường `location` sẽ được auto-populate với tên của location đầu tiên
- API cũ vẫn hoạt động bình thường với `location_id` single

## Migration Status

✅ Junction table `tour_location` đã được tạo
✅ Model relationships đã được cập nhật  
✅ Controller logic đã được cập nhật
✅ API endpoints mới đã được thêm

## Usage Examples

### Frontend Integration

```javascript
// Tạo tour với multiple locations
const tourData = {
  name: "Tour Miền Bắc",
  description: "Khám phá vẻ đẹp miền Bắc",
  location_ids: [
    "hanoi-uuid",
    "sapa-uuid", 
    "halong-uuid"
  ],
  price: 2000000
};

fetch('/api/tours', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(tourData)
});
```

### Hiển thị locations trong tour
```javascript
// Response từ API
const tour = {
  name: "Tour Miền Bắc",
  locations: [
    { id: "1", name: "Hà Nội" },
    { id: "2", name: "Sa Pa" },
    { id: "3", name: "Hạ Long" }
  ]
};

// Hiển thị trong UI
const locationNames = tour.locations.map(loc => loc.name).join(", ");
// "Hà Nội, Sa Pa, Hạ Long"
```

## Benefits

1. **Linh hoạt hơn**: Một tour có thể đi qua nhiều điểm
2. **Tìm kiếm tốt hơn**: User có thể tìm tour theo bất kỳ location nào trong tour
3. **Quản lý dễ dàng**: Admin/Agency có thể quản lý locations của tour một cách chi tiết
4. **Backward Compatible**: Không phá vỡ code hiện tại

## Notes

- Tính năng này hoàn toàn tương thích với hệ thống hiện tại
- Trường `location` string vẫn được duy trì để đảm bảo tương thích
- Multiple locations sẽ được lưu trong bảng junction `tour_location`
- Auto-population của trường `location` dựa trên location đầu tiên trong danh sách
