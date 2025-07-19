# 🧪 TEST COMMISSION SYSTEM APIs

## Test URLs (Server running on port 5001)

### 📊 Dashboard APIs

**Admin Dashboard - Overview:**
```bash
curl -X GET "http://localhost:5001/api/dashboard/commissions/admin/overview?period=month" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Admin Dashboard - Pending Commissions:**
```bash
curl -X GET "http://localhost:5001/api/dashboard/commissions/admin/pending?limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Agency Dashboard - Stats:**
```bash
curl -X GET "http://localhost:5001/api/dashboard/commissions/agency/stats?period=month" \
  -H "Authorization: Bearer YOUR_AGENCY_TOKEN" \
  -H "Content-Type: application/json"
```

**Agency Dashboard - History:**
```bash
curl -X GET "http://localhost:5001/api/dashboard/commissions/agency/history?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_AGENCY_TOKEN" \
  -H "Content-Type: application/json"
```

### 💰 Admin Commission APIs

**Calculate Commission for Booking:**
```bash
curl -X POST "http://localhost:5001/api/admin/commissions/calculate/BOOKING_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force": false}'
```

**Batch Calculate Commissions:**
```bash
curl -X POST "http://localhost:5001/api/admin/commissions/batch-calculate" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_ids": ["booking-id-1", "booking-id-2"],
    "force": false
  }'
```

**Commission Report:**
```bash
curl -X GET "http://localhost:5001/api/admin/commissions/report?date_from=2025-07-01&date_to=2025-07-31" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Get Commission Settings:**
```bash
curl -X GET "http://localhost:5001/api/admin/commissions/settings?agency_id=AGENCY_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Create Commission Setting:**
```bash
curl -X POST "http://localhost:5001/api/admin/commissions/settings" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "agency-user-id",
    "commission_rate": 12.50,
    "min_booking_value": 5000000,
    "max_booking_value": null,
    "tour_category_id": null,
    "effective_from": "2025-08-01T00:00:00.000Z",
    "effective_to": null
  }'
```

---

## 🔑 Getting Admin Token

**Login as Admin:**
```bash
curl -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "your_admin_password"
  }'
```

**Response will include:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin-id",
    "email": "admin@gmail.com", 
    "role": "admin"
  }
}
```

Use the `token` value in Authorization header as `Bearer TOKEN`.

---

## 🏢 Getting Agency Token

**Login as Agency:**
```bash
curl -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agency@gmail.com",
    "password": "your_agency_password"
  }'
```

---

## 📋 Test Scenarios

### 1. End-to-End Commission Test
1. Login as admin to get token
2. Find a booking ID from database
3. Calculate commission for that booking
4. Check dashboard overview
5. View commission report

### 2. Agency Dashboard Test
1. Login as agency to get token
2. View agency stats
3. Check commission history
4. Verify earnings calculation

### 3. Commission Settings Test
1. Login as admin
2. Create commission setting for specific agency
3. Calculate commission for booking from that agency
4. Verify custom rate is applied

---

## ✅ Expected Results

**Commission Calculation:**
```json
{
  "success": true,
  "message": "Tính hoa hồng thành công", 
  "data": {
    "booking_id": "uuid",
    "total_price": 3500000,
    "commission_rate": 15.00,
    "admin_commission": 525000,
    "agency_amount": 2975000,
    "agency_name": "Công ty Du lịch Cúc Cu",
    "calculated_at": "2025-07-19T..."
  }
}
```

**Dashboard Overview:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_bookings": 156,
      "total_revenue": 312000000,
      "total_admin_commission": 46800000,
      "avg_commission_rate": 15.0
    },
    "top_agencies": [...]
  }
}
```

---

## 🚨 Common Errors & Solutions

**401 Unauthorized:**
- Make sure to include `Authorization: Bearer TOKEN` header
- Check if token is valid and not expired

**403 Forbidden:**
- Admin endpoints require admin role
- Agency endpoints require agency role

**404 Not Found:**
- Check if booking ID exists
- Verify API endpoint URLs

**500 Internal Server Error:**
- Check server logs for detailed error
- Verify database connection

---

**🎉 All APIs are ready for testing!**
