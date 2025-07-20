# 🎯 **UNIFIED BOOKING API - HỖ TRỢ CẢ USER VÀ GUEST**

## 📋 **TỔNG QUAN**

**Endpoint duy nhất** `POST /api/bookings` giờ đã hỗ trợ **cả hai trường hợp**:

1. **👤 User đăng nhập** - Có token authentication
2. **🎫 Guest vãng lai** - Không có token

Hệ thống tự động phát hiện và xử lý phù hợp cho từng loại user.

---

## 🔧 **API ENDPOINT**

### **POST /api/bookings**

**Authentication:** ⚡ **Optional** (Tự động phát hiện)  
**Method:** POST  
**URL:** `http://localhost:5001/api/bookings`

---

## 🎯 **CÁCH HOẠT ĐỘNG**

### **🔍 Auto-Detection Logic:**

```javascript
// Middleware kiểm tra token
if (req.headers.authorization && valid_token) {
  // ✅ Authenticated User
  finalUserId = req.user.id;
  bookingType = "AUTHENTICATED_USER";
} else {
  // 🎫 Guest User  
  finalUserId = GUEST_USER_ID; // "3ca8bb89-a406-4deb-96a7-dab4d9be3cc1"
  bookingType = "GUEST_USER";
}
```

---

## 📝 **REQUEST FORMAT**

### **Request Body (Giống nhau cho cả 2 trường hợp):**

```json
{
  "tour_id": "dalat-tour-12345",
  "departure_date_id": "dalat-departure-jul25",
  "promotion_id": "uuid-promotion", // optional
  "total_price": 2900000,
  "number_of_adults": 1,
  "number_of_children": 0,
  "guests": [
    {
      "name": "Nguyễn Văn A",
      "email": "a@example.com", // Bắt buộc cho người đại diện
      "phone": "0123456789",
      "cccd": "089303002985"
    }
  ]
}
```

### **Headers cho User đăng nhập:**

```http
POST /api/bookings
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

### **Headers cho Guest:**

```http
POST /api/bookings
Content-Type: application/json
// Không có Authorization header
```

---

## ✅ **RESPONSE FORMAT**

### **Response Success (201):**

```json
{
  "success": true,
  "message": "MESSAGE_TÙY_THEO_LOẠI_USER",
  "bookingType": "AUTHENTICATED_USER|GUEST_USER", 
  "data": {
    "id": "booking-uuid",
    "user_id": "user-uuid-hoặc-guest-uuid",
    "tour_id": "tour-uuid",
    "total_price": 2900000,
    "status": "pending",
    "user": {
      "id": "user-uuid",
      "name": "Tên user hoặc Guest User",
      "email": "email user hoặc guest@tour.com"
    },
    "tour": {
      "id": "tour-uuid",
      "name": "Tour Đà Lạt Mộng Mơ 3N2Đ",
      "destination": "Đà Lạt",
      "price": 2900000
    },
    "guests": [
      {
        "id": "guest-uuid",
        "name": "Nguyễn Văn A",
        "email": "a@example.com",
        "phone": "0123456789"
      }
    ]
  }
}
```

### **Message theo Booking Type:**

- **AUTHENTICATED_USER**: `"Đặt tour thành công! Booking đã được tạo cho tài khoản của bạn."`
- **GUEST_USER**: `"Đặt tour thành công! Vui lòng kiểm tra email để nhận thông tin chi tiết."`

---

## 🎯 **FRONTEND IMPLEMENTATION**

### **React Component - Unified Booking:**

```javascript
import React, { useState } from 'react';

const UnifiedBookingForm = () => {
  const [bookingData, setBookingData] = useState({
    tour_id: '',
    departure_date_id: '',
    total_price: 0,
    number_of_adults: 1,
    number_of_children: 0,
    guests: [
      {
        name: '',
        email: '',
        phone: '',
        cccd: ''
      }
    ]
  });

  const handleBooking = async (e) => {
    e.preventDefault();
    
    try {
      // Lấy token từ localStorage (nếu có)
      const token = localStorage.getItem('authToken');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Thêm Authorization header nếu user đã đăng nhập
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(bookingData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Hiển thị message tùy theo booking type
        if (result.bookingType === 'AUTHENTICATED_USER') {
          alert('✅ Đặt tour thành công cho tài khoản của bạn!');
          // Redirect to user booking history
          window.location.href = '/my-bookings';
        } else {
          alert('✅ Đặt tour thành công! Kiểm tra email để nhận thông tin.');
          // Redirect to guest lookup page
          window.location.href = `/guest/lookup?email=${bookingData.guests[0].email}`;
        }
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('❌ Lỗi khi đặt tour');
    }
  };

  return (
    <form onSubmit={handleBooking}>
      {/* Form fields tương tự như trước */}
      <div>
        <label>Tên người đại diện:</label>
        <input 
          type="text"
          value={bookingData.guests[0].name}
          onChange={(e) => {
            const newGuests = [...bookingData.guests];
            newGuests[0].name = e.target.value;
            setBookingData({...bookingData, guests: newGuests});
          }}
          required
        />
      </div>
      
      <div>
        <label>Email người đại diện:</label>
        <input 
          type="email"
          value={bookingData.guests[0].email}
          onChange={(e) => {
            const newGuests = [...bookingData.guests];
            newGuests[0].email = e.target.value;
            setBookingData({...bookingData, guests: newGuests});
          }}
          required
        />
      </div>
      
      <button type="submit">
        {localStorage.getItem('authToken') ? '📝 Đặt Tour' : '🎫 Đặt Tour (Guest)'}
      </button>
    </form>
  );
};

export default UnifiedBookingForm;
```

### **Vue.js Example:**

```javascript
// BookingForm.vue
<template>
  <form @submit.prevent="handleBooking">
    <!-- Form fields -->
    <div>
      <label>Tên người đại diện:</label>
      <input v-model="bookingData.guests[0].name" type="text" required />
    </div>
    
    <div>
      <label>Email người đại diện:</label>
      <input v-model="bookingData.guests[0].email" type="email" required />
    </div>
    
    <button type="submit" :disabled="loading">
      {{ authToken ? '📝 Đặt Tour' : '🎫 Đặt Tour (Guest)' }}
    </button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      bookingData: {
        tour_id: '',
        departure_date_id: '',
        total_price: 0,
        number_of_adults: 1,
        number_of_children: 0,
        guests: [
          {
            name: '',
            email: '',
            phone: '',
            cccd: ''
          }
        ]
      }
    };
  },
  
  computed: {
    authToken() {
      return localStorage.getItem('authToken');
    }
  },
  
  methods: {
    async handleBooking() {
      this.loading = true;
      
      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (this.authToken) {
          headers.Authorization = `Bearer ${this.authToken}`;
        }
        
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(this.bookingData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.$toast.success(result.message);
          
          if (result.bookingType === 'AUTHENTICATED_USER') {
            this.$router.push('/my-bookings');
          } else {
            this.$router.push(`/guest/lookup?email=${this.bookingData.guests[0].email}`);
          }
        } else {
          this.$toast.error(result.message);
        }
      } catch (error) {
        console.error('Error:', error);
        this.$toast.error('Lỗi khi đặt tour');
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

## 🔍 **BUSINESS LOGIC**

### **Auto-Detection Rules:**
1. **Có Authorization header với token hợp lệ** → AUTHENTICATED_USER
2. **Không có hoặc token invalid** → GUEST_USER

### **User ID Assignment:**
- **AUTHENTICATED_USER**: `req.user.id` từ JWT token
- **GUEST_USER**: `"3ca8bb89-a406-4deb-96a7-dab4d9be3cc1"` (Guest User cố định)

### **Validation Rules (giống nhau):**
- Ngày khởi hành ≥ 3 ngày từ hiện tại
- Email người đại diện hợp lệ  
- Tối thiểu 1 khách (người đại diện)

---

## 🧪 **TESTING**

### **Test Guest Booking:**
```bash
curl -X POST http://localhost:5001/api/bookings \\
  -H "Content-Type: application/json" \\
  -d '{
    "tour_id": "dalat-tour-12345",
    "departure_date_id": "dalat-departure-jul25",
    "total_price": 2900000,
    "number_of_adults": 1,
    "number_of_children": 0,
    "guests": [
      {
        "name": "Test Guest",
        "email": "testguest@example.com",
        "phone": "0987654321",
        "cccd": "089303009999"
      }
    ]
  }'
```

### **Test Authenticated Booking:**
```bash
curl -X POST http://localhost:5001/api/bookings \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -d '{
    "tour_id": "dalat-tour-12345",
    "departure_date_id": "dalat-departure-jul25",
    "total_price": 2900000,
    "number_of_adults": 1,
    "number_of_children": 0,
    "guests": [
      {
        "name": "Auth User",
        "email": "user@example.com",
        "phone": "0987654321",
        "cccd": "089303009999"
      }
    ]
  }'
```

---

## ✅ **TÓM TẮT TÍNH NĂNG**

### **✅ ĐÃ HOÀN THÀNH:**
- 🎯 **Unified Endpoint**: `POST /api/bookings` cho cả user và guest
- 🔍 **Auto-Detection**: Tự động phát hiện loại user dựa trên token
- 🔧 **Optional Auth Middleware**: `optionalAuth` middleware 
- 📝 **Consistent API**: Cùng request format cho cả 2 trường hợp
- ✅ **Tested**: Đã test thành công cả guest và authenticated user
- 📊 **Logging**: Server log hiển thị rõ booking type và user info

### **🎯 FRONTEND BENEFITS:**
- **Single API endpoint** để handle tất cả booking
- **Không cần điều kiện phức tạp** ở frontend
- **Automatic user detection** 
- **Consistent response format**
- **Easy maintenance**

### **🚀 PRODUCTION READY:**
Hệ thống booking thống nhất đã sẵn sàng cho production với khả năng:
- Xử lý cả user đăng nhập và guest seamlessly  
- Auto-detect user type và xử lý phù hợp
- Maintain data consistency cho cả 2 flows
- Provide clear feedback cho frontend

**Kết luận: Một endpoint duy nhất `/api/bookings` giờ đã xử lý hoàn hảo cả user đăng nhập và guest vãng lai!** 🎉
