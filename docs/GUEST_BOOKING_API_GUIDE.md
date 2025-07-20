# 🎫 **GUEST BOOKING API - HƯỚNG DẪN CHO KHÁCH VÃNG LAI**

## 📋 **TỔNG QUAN**

Hệ thống hỗ trợ khách vãng lai (guest) đặt tour mà không cần tạo tài khoản. Tất cả guest booking sẽ:
- Sử dụng chung một tài khoản "Guest User" 
- Lưu thông tin người đặt thực tế trong bảng guests
- Có thể tra cứu booking bằng email

---

## 🔧 **API ENDPOINTS**

### **1. Đặt tour cho khách vãng lai**

**Endpoint:** `POST /api/guest/bookings`  
**Authentication:** ❌ Không cần  
**Method:** POST

#### **Request Body:**
```json
{
  "tour_id": "uuid-tour",
  "departure_date_id": "uuid-departure",
  "promotion_id": "uuid-promotion", // optional
  "total_price": 2900000,
  "number_of_adults": 2,
  "number_of_children": 1,
  "guests": [
    {
      "name": "Nguyễn Văn A",
      "email": "a@example.com", // Email người đại diện (bắt buộc)
      "phone": "0123456789",
      "cccd": "089303002985"
    },
    {
      "name": "Nguyễn Thị B", 
      "email": "b@example.com",
      "phone": "0987654321",
      "cccd": "089303002986"
    }
  ]
}
```

#### **Response Success (201):**
```json
{
  "success": true,
  "message": "Đặt tour thành công! Vui lòng kiểm tra email để nhận thông tin chi tiết.",
  "data": {
    "id": "booking-uuid",
    "user_id": "3ca8bb89-a406-4deb-96a7-dab4d9be3cc1", // Guest User ID
    "tour_id": "tour-uuid",
    "departure_date_id": "departure-uuid",
    "total_price": 2900000,
    "status": "pending",
    "user": {
      "id": "3ca8bb89-a406-4deb-96a7-dab4d9be3cc1",
      "name": "Guest User",
      "email": "guest@tour.com",
      "username": "guest"
    },
    "tour": {
      "id": "tour-uuid",
      "name": "Tour du lịch Đà Lạt 4N3Đ",
      "destination": "Đà Lạt",
      "price": 2900000
    },
    "departureDate": {
      "id": "departure-uuid",
      "departure_date": "2025-08-01",
      "number_of_days": 4
    },
    "guests": [
      {
        "id": "guest-uuid-1",
        "name": "Nguyễn Văn A",
        "email": "a@example.com",
        "phone": "0123456789",
        "cccd": "089303002985"
      }
    ]
  }
}
```

---

### **2. Tra cứu booking bằng email**

**Endpoint:** `GET /api/guest/bookings/lookup/:email`  
**Authentication:** ❌ Không cần  
**Method:** GET

#### **Example:**
```http
GET /api/guest/bookings/lookup/tranthingoctuyen.3393@gmail.com
```

#### **Response Success (200):**
```json
{
  "success": true,
  "message": "Tìm thấy 2 booking(s) cho email tranthingoctuyen.3393@gmail.com",
  "data": [
    {
      "id": "booking-uuid-1",
      "total_price": 2900000,
      "status": "pending",
      "booking_date": "2025-07-21T...",
      "tour": {
        "id": "tour-uuid",
        "name": "Tour khám phá Đà Nẵng - Hội An 4N3Đ",
        "destination": "Đà Nẵng",
        "price": 2900000
      },
      "departureDate": {
        "id": "departure-uuid",
        "departure_date": "2025-08-01",
        "number_of_days": 4
      },
      "guests": [
        {
          "id": "guest-uuid",
          "name": "Trần Thị Ngọc Tuyền",
          "email": "tranthingoctuyen.3393@gmail.com",
          "phone": "0123456789",
          "cccd": "089303002985"
        }
      ]
    }
  ],
  "count": 2
}
```

---

### **3. Lấy chi tiết booking guest**

**Endpoint:** `GET /api/guest/bookings/:id`  
**Authentication:** ❌ Không cần  
**Method:** GET

#### **Example:**
```http
GET /api/guest/bookings/01b075eb-c69e-4f58-9c7c-123456789abc
```

#### **Response Success (200):**
```json
{
  "success": true,
  "data": {
    // Tương tự response của create booking
  }
}
```

---

### **4. Validate mã khuyến mãi cho guest**

**Endpoint:** `POST /api/guest/validate-promotion`  
**Authentication:** ❌ Không cần  
**Method:** POST

#### **Request Body:**
```json
{
  "promotion_code": "SUMMER2025",
  "tour_price": 2900000
}
```

#### **Response Success (200):**
```json
{
  "success": true,
  "message": "Mã khuyến mãi hợp lệ",
  "data": {
    "promotion": {
      "id": "promotion-uuid",
      "code": "SUMMER2025",
      "description": "Giảm giá mùa hè",
      "discount_amount": 500000
    },
    "pricing": {
      "original_price": 2900000,
      "discount_amount": 500000,
      "final_price": 2400000,
      "savings": 500000
    }
  }
}
```

---

## 🎯 **FRONTEND IMPLEMENTATION**

### **React Component Example:**

```javascript
import React, { useState } from 'react';

const GuestBookingForm = () => {
  const [bookingData, setBookingData] = useState({
    tour_id: '',
    departure_date_id: '',
    promotion_id: null,
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

  const handleGuestBooking = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/guest/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ Đặt tour thành công!');
        // Redirect to booking confirmation page
        window.location.href = \`/guest/booking-confirmation/\${result.data.id}\`;
      } else {
        alert(\`❌ \${result.message}\`);
      }
    } catch (error) {
      console.error('Error creating guest booking:', error);
      alert('❌ Lỗi khi đặt tour');
    }
  };

  return (
    <form onSubmit={handleGuestBooking}>
      {/* Form fields */}
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
      
      <button type="submit">Đặt Tour</button>
    </form>
  );
};

export default GuestBookingForm;
```

### **Guest Booking Lookup Component:**

```javascript
import React, { useState } from 'react';

const GuestBookingLookup = () => {
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const lookupBookings = async () => {
    if (!email) {
      alert('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(\`/api/guest/bookings/lookup/\${email}\`);
      const result = await response.json();
      
      if (result.success) {
        setBookings(result.data);
      } else {
        alert(\`❌ \${result.message}\`);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error looking up bookings:', error);
      alert('❌ Lỗi khi tra cứu booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>🔍 Tra cứu booking của bạn</h3>
      <div>
        <input 
          type="email"
          placeholder="Nhập email đã dùng để đặt tour"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={lookupBookings} disabled={loading}>
          {loading ? 'Đang tra cứu...' : 'Tìm kiếm'}
        </button>
      </div>

      {bookings.length > 0 && (
        <div>
          <h4>📋 Danh sách booking của bạn:</h4>
          {bookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <h5>{booking.tour.name}</h5>
              <p>Ngày khởi hành: {booking.departureDate.departure_date}</p>
              <p>Tổng giá: {booking.total_price.toLocaleString('vi-VN')} VNĐ</p>
              <p>Trạng thái: {booking.status}</p>
              <p>Người đại diện: {booking.guests[0]?.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuestBookingLookup;
```

---

## 🔍 **BUSINESS LOGIC**

### **Guest User System:**
- Tất cả guest booking dùng chung `user_id`: `3ca8bb89-a406-4deb-96a7-dab4d9be3cc1`
- Thông tin người đặt thực tế lưu trong `InformationBookingTour`
- Email người đại diện (guest đầu tiên) là bắt buộc

### **Validation Rules:**
- Ngày khởi hành phải ≥ 3 ngày từ hiện tại
- Email người đại diện phải hợp lệ
- Tối thiểu 1 khách (người đại diện)

### **Payment Integration:**
- Guest booking có thể thanh toán qua MoMo/VNPay như user bình thường
- Payment endpoints đã support guest booking

---

## 📧 **EMAIL NOTIFICATIONS**

Để hoàn thiện guest booking, nên bổ sung:

```javascript
// Gửi email confirmation cho guest
const sendGuestBookingConfirmation = async (booking) => {
  const representativeEmail = booking.guests[0].email;
  const representativeName = booking.guests[0].name;
  
  await mailer.sendMail({
    to: representativeEmail,
    subject: \`✅ Xác nhận đặt tour \${booking.tour.name}\`,
    html: \`
      <h2>🎉 Đặt tour thành công!</h2>
      <p><strong>Kính chào:</strong> \${representativeName}</p>
      <p><strong>Tour:</strong> \${booking.tour.name}</p>
      <p><strong>Ngày khởi hành:</strong> \${booking.departureDate.departure_date}</p>
      <p><strong>Tổng giá:</strong> \${booking.total_price.toLocaleString('vi-VN')} VNĐ</p>
      <p><strong>Mã booking:</strong> \${booking.id}</p>
      
      <h3>👥 Danh sách khách:</h3>
      \${booking.guests.map(g => \`<p>- \${g.name} (\${g.email})</p>\`).join('')}
      
      <p><strong>📱 Tra cứu booking:</strong> 
        <a href="/guest/lookup?email=\${representativeEmail}">Tại đây</a>
      </p>
      
      <p><em>Vui lòng thanh toán trong vòng 15 phút để giữ chỗ.</em></p>
    \`
  });
};
```

---

## ✅ **TÓM TẮT TÍNH NĂNG**

✅ **ĐÃ HOÀN THÀNH:**
- Endpoint đặt tour cho guest (`POST /api/guest/bookings`)
- Tra cứu booking bằng email (`GET /api/guest/bookings/lookup/:email`)  
- Chi tiết booking guest (`GET /api/guest/bookings/:id`)
- Validate promotion cho guest (`POST /api/guest/validate-promotion`)
- Tự động sử dụng Guest User ID
- Validation business rules đầy đủ

🔄 **CẦN BỔ SUNG:**
- Email confirmation tự động
- Guest booking cancellation endpoint
- Guest payment status tracking
- Guest booking history UI

Hệ thống guest booking đã sẵn sàng sử dụng! 🎉
