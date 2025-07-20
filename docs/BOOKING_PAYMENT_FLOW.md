# 🎯 BOOKING & PAYMENT ENDPOINTS & FLOW

## 📋 **BOOKING ENDPOINTS**

### **Core Booking Operations**
```http
GET    /api/bookings                    # Lấy danh sách bookings (có thể filter by user_id)
GET    /api/bookings/:id                # Lấy booking theo ID
POST   /api/bookings                    # Tạo booking mới
PUT    /api/bookings/:id                # Cập nhật booking
DELETE /api/bookings/:id                # Xóa booking
```

### **Promotion Support**
```http
POST   /api/bookings/validate-promotion # Validate mã giảm giá
```
**Request Body:**
```json
{
  "promotion_code": "DISCOUNT20",
  "tour_price": 1000000
}
```
**Response:**
```json
{
  "valid": true,
  "promotion": {
    "id": "uuid",
    "code": "DISCOUNT20",
    "description": "Giảm 200k",
    "discount_amount": 200000
  },
  "pricing": {
    "original_price": 1000000,
    "discount_amount": 200000,
    "final_price": 800000,
    "savings": 200000
  }
}
```

### **Agency Booking Management**
```http
GET    /api/agency/bookings             # Agency xem bookings của tour mình
GET    /api/agency/bookings/:id         # Chi tiết booking
GET    /api/agency/bookings/stats       # Thống kê booking
GET    /api/agency/bookings/revenue     # Thống kê revenue
GET    /api/agency/bookings/customers   # Danh sách khách hàng
```

### **Admin Booking Management**
```http
GET    /api/admin/bookings              # Admin quản lý tất cả bookings
GET    /api/admin/bookings/:id          # Chi tiết booking
PUT    /api/admin/bookings/:id/status   # Cập nhật trạng thái booking
DELETE /api/admin/bookings/:id          # Xóa booking
PUT    /api/admin/bookings/bulk/status  # Cập nhật hàng loạt
```

---

## 💳 **PAYMENT ENDPOINTS**

### **Payment Query/Details**
```http
GET    /api/payments                    # Lấy danh sách payments
GET    /api/payments/:id                # Lấy payment theo ID
GET    /api/payments/details/:orderId   # Lấy payment theo orderId
GET    /api/payments/by-order/:orderId  # Alias của endpoint trên
GET    /api/payments/by-booking/:bookingId # Lấy payment theo bookingId
```

### **VNPay Integration**
```http
GET    /api/payments/vnpay/create-payment?bookingId={id} # Tạo payment URL
GET    /api/payments/vnpay/return       # Callback URL sau thanh toán
```

### **MoMo Integration**
```http
POST   /api/momo/create-payment         # Tạo MoMo payment
POST   /api/momo/ipn                    # MoMo IPN callback
GET    /api/momo/return                 # MoMo redirect callback
GET    /api/momo/tour/:id/confirmation  # Trang xác nhận thanh toán
```

### **Agency Payment Management**
```http
GET    /api/agency/payments             # Agency xem payments của tour mình
GET    /api/agency/payments/:id         # Chi tiết payment
GET    /api/agency/payments/stats       # Thống kê payment
```

### **Admin Payment Management**
```http
GET    /api/admin/payments              # Admin quản lý tất cả payments
GET    /api/admin/payments/:id          # Chi tiết payment
PUT    /api/admin/payments/:id/status   # Cập nhật trạng thái payment
GET    /api/admin/payments/failed       # Lấy failed payments
PUT    /api/admin/payments/:id/retry    # Retry payment
```

---

## 🚀 **BOOKING FLOW**

### **1. Create Booking Flow**
```
1. Frontend → POST /api/bookings
   ├─ Validate promotion code (nếu có)
   ├─ Check departure date (≥ 3 days from now)
   ├─ Create booking record (status: 'pending')
   ├─ Create guest information records
   └─ Return booking with full relations

2. Booking expires sau 15 phút nếu không thanh toán
   └─ Cron job → Update status to 'expired'
```

### **2. Booking Request Body**
```json
{
  "user_id": "uuid",
  "tour_id": "uuid", 
  "departure_date_id": "uuid",
  "promotion_id": "uuid", // optional
  "original_price": 1000000,
  "discount_amount": 200000, // nếu có promotion
  "total_price": 800000,
  "number_of_adults": 2,
  "number_of_children": 1,
  "guests": [
    {
      "full_name": "Nguyễn Văn A",
      "email": "a@example.com",
      "phone": "0123456789",
      "date_of_birth": "1990-01-01",
      "gender": "male",
      "is_representative": true
    }
  ]
}
```

### **3. Booking Response**
```json
{
  "id": "booking-uuid",
  "user_id": "user-uuid",
  "tour_id": "tour-uuid",
  "departure_date_id": "departure-uuid",
  "promotion_id": "promotion-uuid",
  "original_price": "1000000.00",
  "discount_amount": "200000.00", 
  "total_price": "800000.00",
  "booking_date": "2025-07-19T10:00:00.000Z",
  "status": "pending",
  "tour": { ... },
  "departureDate": { ... },
  "promotion": { ... },
  "guests": [{ ... }]
}
```

---

## 💰 **PAYMENT FLOW**

### **1. VNPay Payment Flow**
```
1. Frontend → GET /api/payments/vnpay/create-payment?bookingId={id}
   ├─ Validate booking exists & status = 'pending'
   ├─ Generate VNPay payment URL
   ├─ Create payment record (status: 'pending')
   └─ Return { paymentUrl }

2. User thanh toán trên VNPay

3. VNPay → GET /api/payments/vnpay/return?{params}
   ├─ Verify signature
   ├─ Update payment status ('completed' | 'failed')
   ├─ Update booking status → 'confirmed' (nếu thành công)
   └─ Redirect to frontend success/failure page
```

### **2. MoMo Payment Flow**
```
1. Frontend → POST /api/momo/create-payment { tourId }
   ├─ Validate tour exists
   ├─ Call MoMo API để tạo payment
   └─ Return MoMo payment response

2. User thanh toán trên MoMo

3. MoMo → POST /api/momo/ipn { orderId, resultCode }
   ├─ Update payment status
   ├─ Update booking status (nếu liên kết)
   └─ Return 'OK' to MoMo

4. MoMo → GET /api/momo/return?{params}
   └─ Redirect user to confirmation page
```

### **3. Payment Models**

#### **Payment Model**
```javascript
{
  id: UUID,
  booking_id: UUID,
  order_id: STRING, // orderId từ VNPay/MoMo
  amount: DECIMAL(12,2),
  payment_date: DATE,
  payment_method: STRING, // 'VNPay', 'MoMo'
  status: ENUM('pending', 'completed', 'failed')
}
```

#### **Booking Model** 
```javascript
{
  id: UUID,
  user_id: UUID,
  tour_id: UUID,
  departure_date_id: UUID,
  promotion_id: UUID, // nullable
  original_price: DECIMAL(12,2),
  discount_amount: DECIMAL(12,2),
  total_price: DECIMAL(12,2),
  booking_date: DATE,
  status: ENUM('pending', 'confirmed', 'cancelled', 'expired')
}
```

---

## ⚡ **COMPLETE USER JOURNEY**

### **Frontend → Backend Flow**
```
1. 🛒 BROWSE TOURS
   GET /api/tours → List all tours

2. 📝 CREATE BOOKING
   POST /api/bookings/validate-promotion → Validate discount code
   POST /api/bookings → Create booking (status: pending)

3. 💳 PAYMENT
   Option A: GET /api/payments/vnpay/create-payment?bookingId={id}
   Option B: POST /api/momo/create-payment { tourId }

4. ✅ CONFIRMATION
   VNPay: /api/payments/vnpay/return
   MoMo: /api/momo/ipn + /api/momo/return

5. 📊 MANAGEMENT
   User: GET /api/bookings?user_id={id}
   Agency: GET /api/agency/bookings  
   Admin: GET /api/admin/bookings
```

### **Payment Status Transitions**
```
Booking: pending → confirmed (payment success)
         pending → expired (15 min timeout)
         pending → cancelled (manual cancel)

Payment: pending → completed (success callback)
         pending → failed (error callback)
```

---

## 🔧 **CONFIGURATIONS**

### **VNPay Config**
```javascript
{
  vnp_TmnCode: "UC8YUKOK",
  vnp_HashSecret: "SWC2RBQG4FJUBH9FQ0RKX1LU7BAP35FD", 
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl: "http://localhost:5001/api/payments/vnpay/return"
}
```

### **MoMo Config** 
```javascript
{
  accessKey: 'F8BBA842ECF85',
  secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  partnerCode: 'MOMO',
  redirectUrl: 'http://localhost:3000/tour/{tourId}/confirmation',
  ipnUrl: 'http://localhost:5001/api/momo/ipn'
}
```

---

## ⚠️ **CURRENT ISSUES & STATUS**

### **✅ Working**
- Booking CRUD operations
- Promotion validation
- Payment query endpoints
- VNPay/MoMo endpoint structure

### **🔧 Need Fixes**
- Database schema promotion_id column
- MoMo service integration timeout
- Environment URLs for production
- Booking expiration cron job timing

### **📋 TODO**
- Add booking notification system
- Implement refund flow
- Add payment retry mechanism
- Integrate with email service for confirmations
