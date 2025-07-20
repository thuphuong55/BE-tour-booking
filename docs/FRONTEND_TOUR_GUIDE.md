# Hướng dẫn Frontend: Thêm và Sửa Tour

## Tổng quan
Hệ thống tour có các ràng buộc phức tạp với nhiều bảng liên quan. Frontend cần sử dụng các endpoint để lấy dữ liệu reference và thực hiện CRUD operations.

## 🎯 Quy trình Frontend

### 1. Lấy dữ liệu reference (Bắt buộc trước khi tạo/sửa tour)

#### A. Lấy tất cả danh mục tour
```javascript
GET /api/data/tour-categories
```
**Response:**
```json
[
  {
    "id": "05c6eabf-14d2-45cc-bf8d-b0e4b4ff7beb",
    "name": "Nghỉ Dưỡng"
  },
  {
    "id": "10f5a7b7-d0cc-49a6-9c28-5b2d73bbe423", 
    "name": "Khám Phá"
  }
]
```

#### B. Lấy tất cả dịch vụ bao gồm
```javascript
GET /api/data/included-services
```
**Response:**
```json
[
  {
    "id": "14a4c859-f91c-402c-8a7e-70762889355e",
    "name": "Hướng dẫn viên chuyên nghiệp"
  },
  {
    "id": "8258742d-de87-440e-b04a-a0051234bb90",
    "name": "Xe du lịch đời mới"
  }
]
```

#### C. Lấy tất cả dịch vụ loại trừ
```javascript
GET /api/data/excluded-services
```
**Response:**
```json
[
  {
    "id": "7489d0a8-d18c-4112-baec-46c128dccd1e",
    "service_name": "Chi phí cá nhân"
  }
]
```

#### D. Lấy tất cả khách sạn
```javascript
GET /api/data/hotels
```
**Response:**
```json
[
  {
    "id_hotel": "82ef4246-1929-47fa-ad9c-cd03df3615c7",
    "ten_khach_san": "Khách sạn Đà Lạt Palace",
    "ten_phong": "Deluxe Room",
    "loai_phong": "VIP"
  }
]
```

### 2. Tạo Tour Mới

#### API Endpoint
```javascript
POST /api/tours
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### Request Body Example
```json
{
  "name": "Tour du lịch Đà Lạt 4N3Đ - Trải nghiệm ngàn hoa",
  "description": "Khám phá vẻ đẹp thơ mộng của Đà Lạt với rừng thông, thác nước và không khí trong lành.",
  "price": 2900000,
  "duration_days": 4,
  "duration_nights": 3,
  "departure_location": "Hồ Chí Minh",
  "location_id": "61d461a7-c081-4585-869e-063f09cdb60e",
  "destination_ids": ["28724d88-f566-408e-8f97-7818d19a7b90"],
  "tour_type": "Trong nước",
  "min_participants": 1,
  "max_participants": 10,
  "status": "draft",
  
  // Ràng buộc với các bảng khác
  "selectedIncludedServices": [
    "14a4c859-f91c-402c-8a7e-70762889355e",
    "8258742d-de87-440e-b04a-a0051234bb90",
    "inc-service-tickets"
  ],
  "selectedExcludedServices": [
    "7489d0a8-d18c-4112-baec-46c128dccd1e",
    "exc-service-drinks"
  ],
  "selectedCategories": [
    "05c6eabf-14d2-45cc-bf8d-b0e4b4ff7beb",
    "10f5a7b7-d0cc-49a6-9c28-5b2d73bbe423"
  ],
  "selectedHotels": [
    "hotel-dalat-b",
    "82ef4246-1929-47fa-ad9c-cd03df3615c7"
  ]
}
```

#### Response Success (201)
```json
{
  "message": "Tạo tour thành công",
  "tour": {
    "id": "new-tour-uuid",
    "name": "Tour du lịch Đà Lạt 4N3Đ - Trải nghiệm ngàn hoa",
    "description": "...",
    "price": 2900000,
    "status": "draft",
    "agency_id": "agency-uuid-from-token",
    "created_at": "2025-07-15T10:00:00.000Z",
    "updated_at": "2025-07-15T10:00:00.000Z"
  }
}
```

### 3. Sửa Tour

#### API Endpoint
```javascript
PUT /api/tours/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### Request Body Example (chỉ các field muốn thay đổi)
```json
{
  "name": "Tour du lịch Đà Lạt 4N3Đ - Cập nhật 2025",
  "price": 3200000,
  "selectedIncludedServices": [
    "14a4c859-f91c-402c-8a7e-70762889355e",
    "new-service-id"
  ],
  "selectedCategories": [
    "05c6eabf-14d2-45cc-bf8d-b0e4b4ff7beb"
  ],
  "status": "active"
}
```

### 4. Lấy thông tin tour để edit

#### Lấy tour complete với tất cả ràng buộc
```javascript
GET /api/tours/:id/complete
```

**Response bao gồm:**
```json
{
  "id": "2",
  "name": "Tour du lịch Đà Lạt 4N3Đ - Trải nghiệm ngàn hoa",
  "description": "...",
  "price": 2900000,
  "duration_days": 4,
  "duration_nights": 3,
  "departure_location": "Hồ Chí Minh",
  "location_id": "61d461a7-c081-4585-869e-063f09cdb60e",
  "destination_ids": ["28724d88-f566-408e-8f97-7818d19a7b90"],
  "tour_type": "Trong nước",
  "min_participants": 1,
  "max_participants": 10,
  "status": "draft",
  "agency_id": "1",
  "created_at": "2025-07-05T14:06:13.000Z",
  "updated_at": "2025-07-15T08:50:04.000Z",
  
  // Dữ liệu liên quan
  "departureDates": [],
  "images": [
    {
      "id": "6409a907-6299-4376-a667-45c697c29273",
      "image_url": "path/to/image1.jpg",
      "is_main": true
    }
  ],
  "includedServices": [
    {
      "id": "14a4c859-f91c-402c-8a7e-70762889355e",
      "name": "Hướng dẫn viên chuyên nghiệp"
    }
  ],
  "excludedServices": [
    {
      "id": "7489d0a8-d18c-4112-baec-46c128dccd1e", 
      "service_name": "Chi phí cá nhân"
    }
  ],
  "categories": [
    {
      "id": "05c6eabf-14d2-45cc-bf8d-b0e4b4ff7beb",
      "name": "Nghỉ Dưỡng"
    }
  ],
  "hotels": [
    {
      "id_hotel": "82ef4246-1929-47fa-ad9c-cd03df3615c7",
      "ten_khach_san": "Khách sạn Đà Lạt Palace",
      "ten_phong": "Deluxe Room",
      "loai_phong": "VIP"
    }
  ],
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
    }
  ]
}
```

## 🔧 Frontend Implementation

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const TourForm = ({ tourId = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_days: '',
    duration_nights: '',
    departure_location: '',
    location_id: '',
    destination_ids: [],
    tour_type: 'Trong nước',
    min_participants: 1,
    max_participants: 10,
    status: 'draft',
    selectedIncludedServices: [],
    selectedExcludedServices: [],
    selectedCategories: [],
    selectedHotels: []
  });

  const [referenceData, setReferenceData] = useState({
    categories: [],
    includedServices: [],
    excludedServices: [],
    hotels: []
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 1. Load reference data khi component mount
  useEffect(() => {
    loadReferenceData();
    if (tourId) {
      loadTourData(tourId);
    }
  }, [tourId]);

  const loadReferenceData = async () => {
    try {
      const [categories, includedServices, excludedServices, hotels] = await Promise.all([
        fetch('/api/data/tour-categories').then(res => res.json()),
        fetch('/api/data/included-services').then(res => res.json()),
        fetch('/api/data/excluded-services').then(res => res.json()),
        fetch('/api/data/hotels').then(res => res.json())
      ]);

      setReferenceData({
        categories,
        includedServices,
        excludedServices,
        hotels
      });
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  const loadTourData = async (id) => {
    try {
      const response = await fetch(`/api/tours/${id}/complete`);
      const tour = await response.json();
      
      setFormData({
        ...tour,
        selectedIncludedServices: tour.includedServices.map(s => s.id),
        selectedExcludedServices: tour.excludedServices.map(s => s.id),
        selectedCategories: tour.categories.map(c => c.id),
        selectedHotels: tour.hotels.map(h => h.id_hotel)
      });
    } catch (error) {
      console.error('Error loading tour:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const token = localStorage.getItem('token');
      const method = tourId ? 'PUT' : 'POST';
      const url = tourId ? `/api/tours/${tourId}` : '/api/tours';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        alert(tourId ? 'Cập nhật tour thành công!' : 'Tạo tour thành công!');
        onSuccess && onSuccess(result.tour);
      } else {
        if (result.invalidIds) {
          setErrors({ invalidIds: result.invalidIds });
        }
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting tour:', error);
      alert('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (field, selectedIds) => {
    setFormData(prev => ({
      ...prev,
      [field]: selectedIds
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="tour-form">
      <h2>{tourId ? 'Sửa Tour' : 'Tạo Tour Mới'}</h2>
      
      {/* Basic Info */}
      <div className="form-group">
        <label>Tên Tour *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label>Mô tả</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={4}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Giá (VNĐ) *</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
            required
          />
        </div>

        <div className="form-group">
          <label>Số ngày *</label>
          <input
            type="number"
            value={formData.duration_days}
            onChange={(e) => setFormData({...formData, duration_days: Number(e.target.value)})}
            required
          />
        </div>

        <div className="form-group">
          <label>Số đêm *</label>
          <input
            type="number"
            value={formData.duration_nights}
            onChange={(e) => setFormData({...formData, duration_nights: Number(e.target.value)})}
            required
          />
        </div>
      </div>

      {/* Categories */}
      <div className="form-group">
        <label>Danh mục tour</label>
        <div className="checkbox-group">
          {referenceData.categories.map(category => (
            <label key={category.id} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.selectedCategories.includes(category.id)}
                onChange={(e) => {
                  const updatedCategories = e.target.checked
                    ? [...formData.selectedCategories, category.id]
                    : formData.selectedCategories.filter(id => id !== category.id);
                  handleSelectChange('selectedCategories', updatedCategories);
                }}
              />
              {category.name}
            </label>
          ))}
        </div>
        {errors.invalidIds?.categories && (
          <span className="error">Một số danh mục không hợp lệ</span>
        )}
      </div>

      {/* Included Services */}
      <div className="form-group">
        <label>Dịch vụ bao gồm</label>
        <div className="checkbox-group">
          {referenceData.includedServices.map(service => (
            <label key={service.id} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.selectedIncludedServices.includes(service.id)}
                onChange={(e) => {
                  const updatedServices = e.target.checked
                    ? [...formData.selectedIncludedServices, service.id]
                    : formData.selectedIncludedServices.filter(id => id !== service.id);
                  handleSelectChange('selectedIncludedServices', updatedServices);
                }}
              />
              {service.name}
            </label>
          ))}
        </div>
      </div>

      {/* Excluded Services */}
      <div className="form-group">
        <label>Dịch vụ không bao gồm</label>
        <div className="checkbox-group">
          {referenceData.excludedServices.map(service => (
            <label key={service.id} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.selectedExcludedServices.includes(service.id)}
                onChange={(e) => {
                  const updatedServices = e.target.checked
                    ? [...formData.selectedExcludedServices, service.id]
                    : formData.selectedExcludedServices.filter(id => id !== service.id);
                  handleSelectChange('selectedExcludedServices', updatedServices);
                }}
              />
              {service.service_name}
            </label>
          ))}
        </div>
      </div>

      {/* Hotels */}
      <div className="form-group">
        <label>Khách sạn</label>
        <div className="checkbox-group">
          {referenceData.hotels.map(hotel => (
            <label key={hotel.id_hotel} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.selectedHotels.includes(hotel.id_hotel)}
                onChange={(e) => {
                  const updatedHotels = e.target.checked
                    ? [...formData.selectedHotels, hotel.id_hotel]
                    : formData.selectedHotels.filter(id => id !== hotel.id_hotel);
                  handleSelectChange('selectedHotels', updatedHotels);
                }}
              />
              {hotel.ten_khach_san} - {hotel.ten_phong} ({hotel.loai_phong})
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Trạng thái</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
        >
          <option value="draft">Nháp</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Tạm dừng</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Đang xử lý...' : (tourId ? 'Cập nhật Tour' : 'Tạo Tour')}
        </button>
        <button type="button" className="btn btn-secondary">
          Hủy
        </button>
      </div>
    </form>
  );
};

export default TourForm;
```

## 🚨 Validation và Error Handling

### Validation Rules
1. **Tên tour**: Bắt buộc
2. **Giá**: Bắt buộc, số dương
3. **Số ngày/đêm**: Bắt buộc, số nguyên dương
4. **IDs trong arrays**: Phải tồn tại trong database

### Common Errors
```json
{
  "message": "Một số IncludedService không tồn tại",
  "invalidIds": ["invalid-id-1", "invalid-id-2"]
}
```

```json
{
  "message": "Một số TourCategory không tồn tại", 
  "invalidIds": ["invalid-category-id"]
}
```

## 📋 Checklist cho Frontend Developer

### ✅ Trước khi implement:
- [ ] Hiểu cấu trúc database và quan hệ
- [ ] Test tất cả API endpoints với Postman
- [ ] Lấy được dữ liệu reference từ `/api/data/*`

### ✅ Khi implement form:
- [ ] Load reference data trước
- [ ] Handle loading states
- [ ] Validate input trước khi submit
- [ ] Handle validation errors từ backend
- [ ] Show success/error messages
- [ ] Reset form sau khi thành công

### ✅ Sau khi implement:
- [ ] Test create tour hoàn chỉnh
- [ ] Test update tour với partial data
- [ ] Test validation với invalid IDs
- [ ] Test với user không có quyền
- [ ] Test reload page và edit tour

## 🎯 Kết luận

Hệ thống tour có cấu trúc phức tạp với nhiều ràng buộc. Frontend cần:

1. **Load reference data** từ `/api/data/*` endpoints trước
2. **Sử dụng đúng field names** khi submit (selectedIncludedServices, selectedCategories, etc.)
3. **Handle validation errors** từ backend về invalid IDs
4. **Dùng GET /api/tours/:id/complete** để load dữ liệu edit
5. **Có proper error handling** và loading states

**Tất cả endpoints đã sẵn sàng cho Frontend tích hợp!** 🚀
