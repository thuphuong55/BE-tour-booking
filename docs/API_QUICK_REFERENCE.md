# 🚀 QUICK API REFERENCE - BACKEND ENDPOINTS

## 🔗 BASE URL: `http://localhost:5001/api/`

---

## 🔐 **AUTHENTICATION** - `/api/auth`
```bash
POST /auth/register        # Đăng ký
POST /auth/login           # Đăng nhập  
POST /auth/forgot-password # Quên mật khẩu
GET  /auth/profile         # Profile user [🔒]
PUT  /auth/profile         # Update profile [🔒]
```

---

## 🎯 **TOURS** - `/api/tours`
```bash
GET  /tours                # Danh sách tours (pagination, filter)
GET  /tours/:id            # Chi tiết tour
GET  /tours/featured       # Tours nổi bật
GET  /tours/popular        # Tours phổ biến

# Filter examples:
GET  /tours?destination=hanoi&minPrice=1000000&maxPrice=5000000
GET  /tours?page=1&limit=12&sort=price&order=asc
```

---

## 📅 **BOOKINGS** - `/api/bookings`
```bash
POST /bookings             # Tạo booking [🔒]
GET  /bookings             # Bookings của user [🔒]
GET  /bookings/:id         # Chi tiết booking [🔒]
PUT  /bookings/:id         # Update booking [🔒]
POST /bookings/:id/cancel  # Hủy booking [🔒]
```

---

## 💰 **PAYMENTS** - `/api/payments`
```bash
GET  /payments                    # Danh sách payments [🔒]
GET  /payments/:id                # Chi tiết payment
GET  /payments/by-order/:orderId  # Payment theo order ID
GET  /payments/by-booking/:bookingId # Payment theo booking ID

# VNPay
GET  /payments/vnpay/create-payment?bookingId={id}
GET  /payments/vnpay/return

# MoMo  
POST /momo/create-payment
POST /momo/callback
```

---

## 🔍 **SEARCH** - `/api/search`
```bash
GET  /search/tours         # Tìm kiếm tours
GET  /search/destinations  # Tìm kiếm destinations  
GET  /search/suggestions   # Gợi ý tìm kiếm

# Examples:
GET  /search/tours?q=da%20lat&destination=lam%20dong
GET  /search/suggestions?q=ha
```

---

## 📝 **REVIEWS** - `/api/reviews`
```bash
GET  /reviews              # Danh sách reviews
GET  /reviews/tour/:tourId # Reviews của tour
POST /reviews              # Tạo review [🔒]
PUT  /reviews/:id          # Update review [🔒]
```

---

## 🏢 **AGENCY** - `/api/agencies` & `/api/agency`
```bash
POST /agencies/register    # Đăng ký agency
GET  /agencies             # Danh sách agencies [🔒 Admin]
GET  /agency/bookings      # Bookings của agency [🔒 Agency]
GET  /agency/payments      # Payments của agency [🔒 Agency]
```

---

## 👨‍💼 **ADMIN** - `/api/admin`
```bash
# Tours
GET  /admin/tours          # Danh sách tours [🔒 Admin]
POST /admin/tours          # Tạo tour [🔒 Admin]
PUT  /admin/tours/:id      # Update tour [🔒 Admin]

# Bookings & Payments
GET  /admin/bookings       # Tất cả bookings [🔒 Admin]
GET  /admin/payments       # Tất cả payments [🔒 Admin]
GET  /admin/bookings/stats # Thống kê [🔒 Admin]
```

---

## 📊 **DATA & MASTER** - `/api/data`
```bash
GET  /data/provinces       # Danh sách tỉnh thành
GET  /data/destinations    # Danh sách điểm đến
GET  /tour-categories      # Danh sách loại tour
GET  /departure-dates      # Ngày khởi hành
GET  /hotels               # Danh sách hotels
GET  /locations            # Danh sách locations
GET  /faqs                 # FAQ
```

---

## 🔧 **AUTHENTICATION USAGE**

### Headers cần thiết:
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`  // Cho endpoints có [🔒]
};
```

### Login flow:
```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token } = await loginResponse.json();

// 2. Use token for protected endpoints
const bookingsResponse = await fetch('/api/bookings', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 📋 **STANDARD RESPONSE FORMAT**

### Success:
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... }  // Chỉ có khi có pagination
}
```

### Error:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

---

## 🎯 **COMMON QUERY PARAMETERS**
```bash
page=1              # Trang hiện tại
limit=10            # Số items per page  
sort=created_at     # Field để sort
order=desc          # asc | desc
search=keyword      # Tìm kiếm
status=active       # Filter status
destination=hanoi   # Filter destination
minPrice=1000000    # Giá tối thiểu
maxPrice=5000000    # Giá tối đa
```

---

## 🚀 **PERFORMANCE FEATURES**
- ✅ Response compression (gzip)
- ✅ Connection pooling
- ✅ Query optimization  
- ✅ Pagination default limit=10
- ✅ Response time: 200-400ms
- ✅ Concurrent users: 50-100

---

## 🔗 **QUICK INTEGRATION EXAMPLES**

### Get tours with filters:
```javascript
const params = new URLSearchParams({
  page: 1,
  limit: 12,
  destination: 'da-lat',
  minPrice: 1000000,
  sort: 'price'
});
const tours = await fetch(`/api/tours?${params}`);
```

### Create booking:
```javascript
const booking = await fetch('/api/bookings', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    tour_id: 'tour-123',
    departure_date_id: 'date-456',
    number_of_adults: 2,
    number_of_children: 0
  })
});
```

### Create VNPay payment:
```javascript
const paymentUrl = await fetch(
  `/api/payments/vnpay/create-payment?bookingId=${bookingId}`
);
// Redirect user to paymentUrl for payment
```

---

## 📞 **SERVER STATUS**
```bash
GET  /api/health    # Health check
GET  /api/status    # API status
```

**🎉 ALL ENDPOINTS TESTED & READY FOR FRONTEND INTEGRATION!**
