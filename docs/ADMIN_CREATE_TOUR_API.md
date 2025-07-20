# 🆕 **ADMIN CREATE TOUR API - FRONTEND GUIDE**

## 📋 **TỔNG QUAN**

Admin giờ đã có thể tạo tour mới cho bất kỳ agency nào. API này cho phép admin chọn agency từ dropdown và tạo tour với đầy đủ thông tin.

---

## 🔧 **API ENDPOINT**

### **Tạo tour mới (Admin)**

**Endpoint:** `POST /api/admin/tours`  
**Authentication:** Required (Admin only)  
**Method:** POST

---

## 📝 **REQUEST FORMAT**

### **Headers:**
```javascript
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

### **Request Body:**
```javascript
{
  // 🆕 BẮT BUỘC: Agency ID
  "agency_id": "uuid-of-agency",
  
  // Core tour data
  "name": "Tour Đà Lạt 4N3Đ",
  "description": "Tour khám phá Đà Lạt với nhiều điểm đến hấp dẫn",
  "location": "Đà Lạt",
  "destination": "Thác Datanla, Làng hoa, Chợ đêm",
  "departure_location": "TP.HCM",
  "price": 2900000,
  "tour_type": "Trong nước", // hoặc "Quốc tế"
  "max_participants": 25,
  "min_participants": 5,
  "status": "Chờ duyệt", // hoặc "Đang hoạt động"
  
  // Relationships (optional)
  "hotel_ids": [1, 2, 3],
  "category_ids": [1, 2],
  "included_service_ids": [1, 2, 3],
  
  // Images (optional)
  "images": [
    {
      "image_url": "https://example.com/image1.jpg",
      "is_main": true
    },
    {
      "image_url": "https://example.com/image2.jpg", 
      "is_main": false
    }
  ],
  
  // Departure dates (optional)
  "departureDates": [
    {
      "departure_date": "2025-08-01",
      "end_date": "2025-08-04",
      "number_of_days": 4,
      "number_of_nights": 3
    },
    {
      "departure_date": "2025-08-15",
      "end_date": "2025-08-18", 
      "number_of_days": 4,
      "number_of_nights": 3
    }
  ]
}
```

---

## 📊 **RESPONSE FORMAT**

### **Success Response (201):**
```json
{
  "success": true,
  "message": "Tour 'Đà Lạt 4N3Đ' đã được tạo thành công cho agency 'Du lịch ABC'",
  "data": {
    "tour": {
      "id": "uuid",
      "name": "Tour Đà Lạt 4N3Đ",
      "description": "Tour khám phá...",
      "location": "Đà Lạt",
      "destination": "Thác Datanla...",
      "price": 2900000,
      "status": "Chờ duyệt",
      "agency_id": "uuid",
      "agency": {
        "id": "uuid",
        "name": "Du lịch ABC",
        "user": {
          "email": "agency@example.com"
        }
      },
      "images": [
        {
          "id": "uuid",
          "image_url": "https://example.com/image1.jpg",
          "is_main": true
        }
      ],
      "departureDates": [
        {
          "id": "uuid",
          "departure_date": "2025-08-01",
          "end_date": "2025-08-04",
          "number_of_days": 4,
          "number_of_nights": 3
        }
      ],
      "categories": [
        {
          "id": "uuid",
          "name": "Du lịch sinh thái"
        }
      ],
      "includedServices": [
        {
          "id": "uuid", 
          "name": "Ăn sáng"
        }
      ]
    },
    "createdBy": "admin@example.com",
    "createdAt": "2025-07-20T15:30:00Z"
  }
}
```

### **Error Responses:**

#### **400 - Missing agency_id:**
```json
{
  "success": false,
  "message": "Cần chọn agency để tạo tour"
}
```

#### **404 - Agency not found:**
```json
{
  "success": false,
  "message": "Agency không tồn tại"
}
```

#### **400 - Agency not approved:**
```json
{
  "success": false,
  "message": "Agency chưa được duyệt, không thể tạo tour"
}
```

#### **500 - Server error:**
```json
{
  "success": false,
  "message": "Lỗi khi tạo tour",
  "error": "Error details..."
}
```

---

## 🎯 **FRONTEND IMPLEMENTATION**

### **1. Lấy danh sách agencies:**

```javascript
// Service để lấy agencies
const getAgencies = async () => {
  const response = await fetch('/api/agencies', {
    headers: {
      'Authorization': `Bearer ${getAdminToken()}`
    }
  });
  return response.json();
};
```

### **2. React Component Example:**

```jsx
import React, { useState, useEffect } from 'react';

const AdminCreateTour = () => {
  const [agencies, setAgencies] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState('');
  const [tourData, setTourData] = useState({
    name: '',
    description: '',
    location: '',
    destination: '',
    price: '',
    tour_type: 'Trong nước',
    max_participants: '',
    min_participants: '',
    status: 'Chờ duyệt'
  });
  const [images, setImages] = useState([]);
  const [departureDates, setDepartureDates] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Load agencies khi component mount
  useEffect(() => {
    const loadAgencies = async () => {
      try {
        const agenciesData = await getAgencies();
        // Chỉ hiển thị agencies đã approved
        const approvedAgencies = agenciesData.filter(a => a.status === 'approved');
        setAgencies(approvedAgencies);
      } catch (error) {
        console.error('Error loading agencies:', error);
      }
    };
    
    loadAgencies();
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAgency) {
      alert('Vui lòng chọn agency');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/tours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify({
          agency_id: selectedAgency,
          ...tourData,
          price: parseFloat(tourData.price),
          max_participants: parseInt(tourData.max_participants),
          min_participants: parseInt(tourData.min_participants),
          images,
          departureDates
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ ${result.message}`);
        // Reset form hoặc redirect
        resetForm();
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating tour:', error);
      alert('❌ Lỗi khi tạo tour');
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setSelectedAgency('');
    setTourData({
      name: '',
      description: '',
      location: '',
      destination: '',
      price: '',
      tour_type: 'Trong nước',
      max_participants: '',
      min_participants: '',
      status: 'Chờ duyệt'
    });
    setImages([]);
    setDepartureDates([]);
  };
  
  return (
    <div className="admin-create-tour">
      <h2>🆕 Tạo Tour Mới</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Agency Selection */}
        <div className="form-group">
          <label>🏢 Chọn Agency: *</label>
          <select 
            value={selectedAgency} 
            onChange={(e) => setSelectedAgency(e.target.value)}
            required
          >
            <option value="">-- Chọn Agency --</option>
            {agencies.map(agency => (
              <option key={agency.id} value={agency.id}>
                {agency.name} ({agency.user?.email})
              </option>
            ))}
          </select>
        </div>
        
        {/* Tour Basic Info */}
        <div className="form-group">
          <label>📝 Tên Tour: *</label>
          <input
            type="text"
            value={tourData.name}
            onChange={(e) => setTourData({...tourData, name: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>📄 Mô tả:</label>
          <textarea
            value={tourData.description}
            onChange={(e) => setTourData({...tourData, description: e.target.value})}
            rows={4}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>📍 Địa điểm: *</label>
            <input
              type="text"
              value={tourData.location}
              onChange={(e) => setTourData({...tourData, location: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>🎯 Điểm đến:</label>
            <input
              type="text"
              value={tourData.destination}
              onChange={(e) => setTourData({...tourData, destination: e.target.value})}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>💰 Giá tour (VNĐ): *</label>
            <input
              type="number"
              value={tourData.price}
              onChange={(e) => setTourData({...tourData, price: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>🌍 Loại tour:</label>
            <select
              value={tourData.tour_type}
              onChange={(e) => setTourData({...tourData, tour_type: e.target.value})}
            >
              <option value="Trong nước">Trong nước</option>
              <option value="Quốc tế">Quốc tế</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>👥 Số người tối đa:</label>
            <input
              type="number"
              value={tourData.max_participants}
              onChange={(e) => setTourData({...tourData, max_participants: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>👤 Số người tối thiểu:</label>
            <input
              type="number"
              value={tourData.min_participants}
              onChange={(e) => setTourData({...tourData, min_participants: e.target.value})}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>📊 Trạng thái:</label>
          <select
            value={tourData.status}
            onChange={(e) => setTourData({...tourData, status: e.target.value})}
          >
            <option value="Chờ duyệt">Chờ duyệt</option>
            <option value="Đang hoạt động">Đang hoạt động</option>
          </select>
        </div>
        
        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? '⏳ Đang tạo...' : '✅ Tạo Tour'}
          </button>
          <button type="button" onClick={resetForm}>
            🔄 Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateTour;
```

### **3. Vue.js Example:**

```vue
<template>
  <div class="admin-create-tour">
    <h2>🆕 Tạo Tour Mới</h2>
    
    <form @submit.prevent="handleSubmit">
      <!-- Agency Selection -->
      <div class="form-group">
        <label>🏢 Chọn Agency: *</label>
        <select v-model="selectedAgency" required>
          <option value="">-- Chọn Agency --</option>
          <option 
            v-for="agency in agencies" 
            :key="agency.id" 
            :value="agency.id"
          >
            {{ agency.name }} ({{ agency.user?.email }})
          </option>
        </select>
      </div>
      
      <!-- Tour Basic Info -->
      <div class="form-group">
        <label>📝 Tên Tour: *</label>
        <input 
          v-model="tourData.name" 
          type="text" 
          required 
        />
      </div>
      
      <!-- More form fields... -->
      
      <div class="form-actions">
        <button type="submit" :disabled="loading">
          {{ loading ? '⏳ Đang tạo...' : '✅ Tạo Tour' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'AdminCreateTour',
  data() {
    return {
      agencies: [],
      selectedAgency: '',
      tourData: {
        name: '',
        description: '',
        location: '',
        destination: '',
        price: '',
        tour_type: 'Trong nước',
        max_participants: '',
        min_participants: '',
        status: 'Chờ duyệt'
      },
      loading: false
    };
  },
  
  async mounted() {
    await this.loadAgencies();
  },
  
  methods: {
    async loadAgencies() {
      try {
        const response = await this.$http.get('/api/agencies');
        this.agencies = response.data.filter(a => a.status === 'approved');
      } catch (error) {
        console.error('Error loading agencies:', error);
      }
    },
    
    async handleSubmit() {
      if (!this.selectedAgency) {
        alert('Vui lòng chọn agency');
        return;
      }
      
      this.loading = true;
      
      try {
        const response = await this.$http.post('/api/admin/tours', {
          agency_id: this.selectedAgency,
          ...this.tourData,
          price: parseFloat(this.tourData.price),
          max_participants: parseInt(this.tourData.max_participants),
          min_participants: parseInt(this.tourData.min_participants)
        });
        
        if (response.data.success) {
          alert(`✅ ${response.data.message}`);
          this.resetForm();
        }
      } catch (error) {
        console.error('Error creating tour:', error);
        alert('❌ Lỗi khi tạo tour');
      } finally {
        this.loading = false;
      }
    },
    
    resetForm() {
      this.selectedAgency = '';
      this.tourData = {
        name: '',
        description: '',
        location: '',
        destination: '',
        price: '',
        tour_type: 'Trong nước',
        max_participants: '',
        min_participants: '',
        status: 'Chờ duyệt'
      };
    }
  }
};
</script>
```

---

## 🧪 **TESTING**

### **Curl Example:**
```bash
# 1. Login admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "admin123"}'

# 2. Get agencies list
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:5000/api/agencies

# 3. Create tour
curl -X POST http://localhost:5000/api/admin/tours \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "agency_id": "agency-uuid",
    "name": "Test Tour",
    "location": "Đà Lạt",
    "price": 2500000,
    "tour_type": "Trong nước",
    "max_participants": 20,
    "status": "Chờ duyệt"
  }'
```

### **JavaScript Test:**
```javascript
// Run: node test_admin_create_tour.js
// File đã được tạo sẵn: test_admin_create_tour.js
```

---

## 🚨 **IMPORTANT NOTES**

1. **agency_id là bắt buộc** - Admin phải chọn agency
2. **Chỉ agencies approved** - Agency phải có status "approved"
3. **Email notification** - Agency sẽ nhận email thông báo
4. **Permissions** - Chỉ admin có thể dùng endpoint này
5. **Response format** - Giống với admin APIs khác (success/data)

---

## 🎉 **KẾT LUẬN**

✅ **Admin giờ đã có đầy đủ CRUD cho tours:**
- **READ** ✅ Pagination + filters
- **CREATE** ✅ Tạo cho agency 
- **UPDATE** ✅ Cập nhật đầy đủ
- **DELETE** ✅ Xóa với force option

**Frontend có thể implement ngay với dropdown chọn agency và form tạo tour!** 🚀
