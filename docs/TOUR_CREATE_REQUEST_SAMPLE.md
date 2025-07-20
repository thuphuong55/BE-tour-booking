# 🎯 MẪU REQUEST TẠO TOUR - BE TOUR BOOKING

## 📋 1. MẪU REQUEST ĐÚNG CHO TẠO TOUR

### **Endpoint:**
```
POST /api/tours
Headers: 
  Authorization: Bearer <agency_token>
  Content-Type: application/json
```

### **Request Body Mẫu:**
```javascript
{
  // ✅ CORE TOUR DATA (Required)
  "name": "Tour khám phá Đà Lạt 3N2Đ - Thác Datanla & Chợ Đêm",
  "description": "Hành trình khám phá thành phố ngàn hoa với những điểm đến nổi tiếng: Thác Datanla, Chợ Đêm Đà Lạt, Vườn hoa Đà Lạt...",
  "location": "Đà Lạt", 
  "destination": "Thác Datanla, Chợ Đêm Đà Lạt, Vườn hoa Đà Lạt",
  "departure_location": "TP. Hồ Chí Minh",
  "price": 3200000,
  "tour_type": "Trong nước", // hoặc "Quốc tế"
  "max_participants": 15,
  "min_participants": 2,

  // ✅ HÌNH ẢNH TOUR (Optional)
  "images": [
    {
      "image_url": "https://example.com/dalat-main.jpg",
      "is_main": true
    },
    {
      "image_url": "https://example.com/dalat-waterfall.jpg", 
      "is_main": false
    },
    {
      "image_url": "https://example.com/dalat-market.jpg",
      "is_main": false
    }
  ],

  // ✅ NGÀY KHỞI HÀNH (Optional)
  "departureDates": [
    {
      "departure_date": "2025-08-15",
      "end_date": "2025-08-17", 
      "number_of_days": 3,
      "number_of_nights": 2
    },
    {
      "departure_date": "2025-08-22",
      "end_date": "2025-08-24",
      "number_of_days": 3, 
      "number_of_nights": 2
    },
    {
      "departure_date": "2025-08-29",
      "end_date": "2025-08-31",
      "number_of_days": 3,
      "number_of_nights": 2
    }
  ],

  // ✅ DỊCH VỤ BAO GỒM (Optional) - Hỗ trợ nhiều format
  "selectedIncludedServices": [
    "service-uuid-1",
    "service-uuid-2", 
    "service-uuid-3"
  ],
  // HOẶC
  "included_service_ids": [
    "service-uuid-1",
    "service-uuid-2"
  ],

  // ✅ DANH MỤC TOUR (Optional) - Hỗ trợ nhiều format
  "selectedCategories": [
    "category-uuid-1",
    "category-uuid-2"
  ],
  // HOẶC  
  "category_ids": [
    "category-uuid-1",
    "category-uuid-2"
  ],

  // ✅ KHÁCH SẠN (Optional)
  "hotel_ids": [
    "hotel-id-1",
    "hotel-id-2"
  ]
}
```

### **📝 LƯU Ý QUAN TRỌNG:**

1. **Agency ID tự động:** BE sẽ tự động lấy `agency_id` từ user đăng nhập
2. **Status mặc định:** Tour mới tạo sẽ có `status: "Chờ duyệt"`
3. **Validation:** Agency phải đã được approve mới tạo được tour
4. **Field linh hoạt:** Hỗ trợ nhiều format field names cho tương thích

---

## 🔧 2. CÁC FIELD HỖ TRỢ (Flexible Naming)

BE hỗ trợ nhiều cách đặt tên field để tương thích:

```javascript
// Dịch vụ bao gồm:
"selectedIncludedServices": [...] // ✅ Preferred  
"included_service_ids": [...]     // ✅ Alternative

// Danh mục:
"selectedCategories": [...]       // ✅ Preferred
"category_ids": [...]             // ✅ Alternative  

// Khách sạn:
"hotel_ids": [...]                // ✅ Standard

// Images & Departure Dates:
"images": [...]                   // ✅ Standard
"departureDates": [...]           // ✅ Standard
```

---

## 📊 3. RESPONSE MẪU SAU KHI TẠO TOUR

```javascript
{
  "id": "tour-uuid-generated",
  "agency_id": "agency-uuid-from-token", 
  "name": "Tour khám phá Đà Lạt 3N2Đ - Thác Datanla & Chợ Đêm",
  "description": "Hành trình khám phá thành phố ngàn hoa...",
  "location": "Đà Lạt",
  "destination": "Thác Datanla, Chợ Đêm Đà Lạt, Vườn hoa Đà Lạt", 
  "departure_location": "TP. Hồ Chí Minh",
  "price": 3200000,
  "promotion_id": null,
  "tour_type": "Trong nước",
  "max_participants": 15,
  "min_participants": 2,
  "status": "Chờ duyệt", // ← Mặc định
  "created_at": "2025-07-21T10:30:00.000Z",
  "updated_at": "2025-07-21T10:30:00.000Z",

  // Relations được tạo:
  "images": [
    {
      "id": "image-uuid-1",
      "tour_id": "tour-uuid-generated", 
      "image_url": "https://example.com/dalat-main.jpg",
      "is_main": true
    }
    // ... more images
  ],

  "departureDates": [
    {
      "id": "departure-uuid-1",
      "tour_id": "tour-uuid-generated",
      "departure_date": "2025-08-15",
      "end_date": "2025-08-17",
      "number_of_days": 3,
      "number_of_nights": 2
    }
    // ... more dates
  ],

  "categories": [
    {
      "id": "category-uuid-1",
      "name": "Du lịch sinh thái"
    }
    // ... more categories
  ],

  "includedServices": [
    {
      "id": "service-uuid-1", 
      "service_name": "Vé tham quan các điểm du lịch"
    }
    // ... more services
  ],

  "hotels": [
    {
      "id_hotel": "hotel-id-1",
      "ten_khach_san": "Hotel Đà Lạt Palace"
    }
    // ... more hotels
  ]
}
```

---

## 🚨 4. LỖI THƯỜNG GẶP VÀ CÁCH FIX

### **❌ Lỗi Agency chưa được duyệt:**
```json
{
  "error": "Agency chưa được duyệt, không thể tạo tour"
}
```
**Fix:** Đảm bảo agency có `status: "approved"`

### **❌ Lỗi thiếu token:**
```json
{
  "error": "Unauthorized"
}
```
**Fix:** Thêm `Authorization: Bearer <token>` vào header

### **❌ Lỗi service/category không tồn tại:**
```javascript
// BE sẽ log:
"⚠️ Some included services not found: ['invalid-id-1', 'invalid-id-2']"
"✅ Existing services: ['valid-id-1']"
```
**Fix:** Kiểm tra ID services/categories có tồn tại trong database

### **❌ Lỗi hotel không tồn tại:**
```javascript
// BE sẽ log:
"🏨 No valid hotels found to set"
```
**Fix:** Kiểm tra `hotel_ids` có tồn tại trong bảng Hotel

---

## 🔄 5. FLOW SAU KHI TẠO TOUR

1. **Tour được tạo** với `status: "Chờ duyệt"`
2. **Admin cần approve** tour (❌ CHƯA CÓ ENDPOINT)
3. **Sau khi approve** → `status: "Đang hoạt động"`
4. **Tour có thể được book** bởi users

---

## 📧 6. PAYMENT SUCCESS URL - VẤN ĐỀ VÀ FIX

### **🚨 VẤN ĐỀ HIỆN TẠI:**

Trong `vnpayController.js` line 310:
```javascript
return res.redirect("http://localhost:3000/payment-success");
```

**Vấn đề:** URL không chứa orderId → Frontend không biết payment nào thành công!

### **✅ FIX ĐỀ XUẤT:**

```javascript
// THAY ĐỔI TỪ:
return res.redirect("http://localhost:3000/payment-success");

// THÀNH:
return res.redirect(`http://localhost:3000/payment-success?orderId=${orderId}&bookingId=${bookingId}`);
```

### **🔧 IMPLEMENTATION:**

```javascript
// File: controllers/vnpayController.js (line ~310)
if (secureHash === signed) {
  await paymentController.updatePaymentStatus(orderId, "completed");
  
  // Lấy bookingId từ orderId (format: bookingId_random)
  const bookingId = orderId.split('_')[0];
  
  // Gửi email xác nhận booking
  try {
    await sendBookingConfirmationEmail(bookingId, "VNPay", orderId);
    console.log(`✅ Booking confirmation email sent for booking: ${bookingId}`);
  } catch (emailError) {
    console.error('❌ Failed to send confirmation email:', emailError);
  }
  
  // ✅ FIX: Thêm orderId và bookingId vào URL
  return res.redirect(`http://localhost:3000/payment-success?orderId=${orderId}&bookingId=${bookingId}&method=VNPay`);
} else {
  await paymentController.updatePaymentStatus(orderId, "failed");
  
  const bookingId = orderId.split('_')[0];
  try {
    await sendPaymentFailedEmail(bookingId, "VNPay", orderId);
  } catch (emailError) {
    console.error('❌ Failed to send payment failed email:', emailError);
  }
  
  // ✅ FIX: Thêm thông tin lỗi vào URL  
  return res.redirect(`http://localhost:3000/payment-failed?orderId=${orderId}&bookingId=${bookingId}&method=VNPay`);
}
```

### **🎯 FRONTEND SẼ NHẬN:**

**Thành công:**
```
http://localhost:3000/payment-success?orderId=booking-uuid_123456&bookingId=booking-uuid&method=VNPay
```

**Thất bại:**
```
http://localhost:3000/payment-failed?orderId=booking-uuid_123456&bookingId=booking-uuid&method=VNPay
```

### **📱 FRONTEND CÓ THỂ:**

1. **Lấy orderId** để tra cứu thông tin payment
2. **Lấy bookingId** để hiển thị thông tin booking
3. **Hiển thị status** payment cho user
4. **Gọi API** để confirm và reload booking info

---

## 🎯 SUMMARY

### **✅ MẪU REQUEST TẠO TOUR:**
- Core fields: name, description, location, destination, price, etc.
- Optional relations: images, departureDates, services, categories, hotels
- Multiple field naming support cho tương thích

### **✅ PAYMENT URL FIX NEEDED:**
- Thêm orderId + bookingId vào success/failed URLs
- Frontend có thể track được payment status
- Tốt hơn cho UX và debugging

**Cần implement ngay:** Admin approval workflow cho tours! 🚨
