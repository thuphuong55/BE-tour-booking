# 🛡️ **ADMIN AGENCY MANAGEMENT APIs**

## **1. Khóa/Mở khóa Agency**
```http
PUT /api/agencies/toggle-lock/:id
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "action": "lock"  // hoặc "unlock"
}
```

### **Response Success:**
```json
{
  "message": "Đã khóa agency",
  "data": {
    "agencyId": "uuid-agency",
    "userId": "uuid-user", 
    "status": "locked"
  }
}
```

### **Behavior:**
- **Lock**: Agency status → `locked`, User status → `inactive`
- **Unlock**: Agency status → `approved`, User status → `active`
- Gửi email thông báo cho agency
- Chỉ admin mới có quyền

---

## **2. Xóa Agency (Soft/Hard Delete)**
```http
DELETE /api/agencies/:id
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "permanently": false  // true = hard delete, false = soft delete
}
```

### **Soft Delete Response:**
```json
{
  "message": "Đã đánh dấu xóa agency",
  "data": {
    "agencyId": "uuid-agency",
    "permanently": false
  }
}
```

### **Hard Delete Response:**
```json
{
  "message": "Đã xóa vĩnh viễn agency và user",
  "data": {
    "agencyId": "uuid-agency", 
    "permanently": true
  }
}
```

### **Hard Delete Error (có ràng buộc):**
```json
{
  "message": "Không thể xóa agency. Còn 5 tours và 12 bookings liên quan.",
  "data": {
    "tourCount": 5,
    "bookingCount": 12
  }
}
```

### **Behavior:**
- **Soft Delete**: Agency status → `deleted`, User status → `inactive`
- **Hard Delete**: Xóa hoàn toàn Agency và User khỏi database
- Kiểm tra ràng buộc trước khi hard delete
- Gửi email thông báo cho agency
- Chỉ admin mới có quyền

---

## **3. Lấy danh sách Agency (có filter)**
```http
GET /api/agencies?status=approved&page=1&limit=20
Authorization: Bearer {admin_token}
```

### **Response:**
```json
{
  "data": [
    {
      "id": "uuid-agency",
      "name": "Công ty ABC",
      "email": "contact@abc.com",
      "status": "approved",
      "user": {
        "id": "uuid-user",
        "name": "Công ty ABC",
        "email": "contact@abc.com",
        "status": "active"
      }
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "pages": 1
  }
}
```

### **Status Values:**
- `pending` - Chờ duyệt
- `approved` - Đã duyệt  
- `rejected` - Từ chối
- `suspended` - Tạm ngưng
- `locked` - Bị khóa
- `deleted` - Đã xóa

---

## **4. Xem chi tiết Agency**
```http
GET /api/agencies/:id
Authorization: Bearer {admin_token}
```

### **Response:**
```json
{
  "data": {
    "id": "uuid-agency",
    "name": "Công ty ABC",
    "email": "contact@abc.com",
    "phone": "0123456789",
    "address": "123 ABC Street",
    "tax_code": "123456789",
    "business_license": "BL123456",
    "website": "https://abc.com",
    "status": "approved",
    "user": {
      "id": "uuid-user",
      "name": "Công ty ABC", 
      "email": "contact@abc.com",
      "status": "active"
    }
  }
}
```

---

## **📧 Email Notifications**

### **Agency bị khóa:**
```
Subject: Tài khoản Agency bị khóa
Content: Tài khoản Agency ABC đã bị khóa. Vui lòng liên hệ admin.
```

### **Agency được mở khóa:**
```
Subject: Tài khoản Agency được mở khóa  
Content: Tài khoản Agency ABC đã được mở khóa. Bạn có thể đăng nhập bình thường.
```

### **Agency bị xóa:**
```
Subject: Tài khoản Agency bị xóa
Content: Tài khoản Agency ABC đã bị xóa khỏi hệ thống.
```

---

## **🔐 Authorization**

Tất cả endpoints này yêu cầu:
- **Role**: `admin` 
- **Header**: `Authorization: Bearer {admin_token}`
- Token hợp lệ và không hết hạn

---

## **📊 Agency Status Flow**

```
pending → approved → active
       ↓         ↓
    rejected   locked ⟷ approved
               ↓
            deleted
```

- `pending`: Vừa đăng ký, chờ admin duyệt
- `approved`: Admin đã duyệt, agency có thể hoạt động  
- `rejected`: Admin từ chối đăng ký
- `locked`: Admin khóa tạm thời (có thể mở lại)
- `deleted`: Admin xóa (soft delete, có thể restore)
- **Hard delete**: Xóa vĩnh viễn khỏi database
