# 🔄 **TOUR STATUS UPDATE ENDPOINT**

## 📋 **ENDPOINT OVERVIEW**

**URL:** `PATCH /api/tours/:id/status`  
**Purpose:** Cập nhật trạng thái tour cho Admin/Agency  
**Authentication:** Required (JWT Token)  
**Permissions:** Admin (full access) | Agency (limited access)

---

## 🛠️ **REQUEST FORMAT**

### **Headers**
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### **Request Body**
```json
{
  "status": "Đang hoạt động",
  "reason": "Tour đã được kiểm duyệt và phê duyệt" // Optional
}
```

### **Valid Status Values**
```javascript
[
  "Chờ duyệt",      // Pending approval
  "Đang hoạt động",  // Active
  "Ngừng hoạt động", // Suspended
  "Đã hủy"          // Cancelled
]
```

---

## 🏢 **AGENCY PERMISSIONS**

### **Agency Status Change Rules**
```javascript
const agencyStatusRules = {
  "Chờ duyệt": ["Ngừng hoạt động"],        // Can only suspend
  "Đang hoạt động": ["Ngừng hoạt động"],    // Can only suspend
  "Ngừng hoạt động": ["Chờ duyệt"],        // Can resubmit for review
  "Đã hủy": []                             // Cannot change
};
```

### **Business Rules for Agency**
- ✅ **Can only update tours they own** (agency_id check)
- ✅ **Limited status transitions** (see rules above)
- ❌ **Cannot approve tours** (only admin can)
- ❌ **Cannot cancel tours directly** (only suspend)

---

## 👨‍💼 **ADMIN PERMISSIONS**

### **Admin Status Change Rules**
```javascript
const adminStatusRules = {
  "Chờ duyệt": ["Đang hoạt động", "Đã hủy"],        // Approve or reject
  "Đang hoạt động": ["Ngừng hoạt động", "Đã hủy"],  // Suspend or cancel
  "Ngừng hoạt động": ["Đang hoạt động", "Đã hủy"],  // Reactivate or cancel
  "Đã hủy": ["Chờ duyệt"]                           // Restore for review
};
```

### **Business Rules for Admin**
- ✅ **Can update any tour** (no ownership check)
- ✅ **Full status transition rights**
- ✅ **Can approve/reject tours**
- ✅ **Can restore cancelled tours**

---

## 📧 **NOTIFICATION SYSTEM**

### **Email Notifications (Admin Actions)**
```javascript
const notifications = {
  "Đang hoạt động": {
    subject: "Tour đã được duyệt",
    content: "Tour <name> đã được admin phê duyệt và đang hoạt động."
  },
  "Đã hủy": {
    subject: "Tour bị từ chối", 
    content: "Tour <name> đã bị từ chối. Lý do: <reason>"
  },
  "Ngừng hoạt động": {
    subject: "Tour bị tạm ngừng",
    content: "Tour <name> đã bị tạm ngừng hoạt động. Lý do: <reason>"
  }
};
```

### **Notification Rules**
- 📩 **Agency receives email** when admin changes tour status
- 🔕 **No email** when agency changes own tour status
- ⚡ **Immediate delivery** (not queued)

---

## ✅ **SUCCESS RESPONSES**

### **200 OK - Status Updated**
```json
{
  "message": "Đã cập nhật trạng thái tour từ 'Chờ duyệt' sang 'Đang hoạt động'",
  "tour": {
    "id": "7ecdae58-fa8c-44fc-84a6-14f50338350a",
    "name": "Tour Đà Lạt 3N2Đ",
    "oldStatus": "Chờ duyệt",
    "newStatus": "Đang hoạt động",
    "reason": "Tour đã được kiểm duyệt"
  }
}
```

---

## ❌ **ERROR RESPONSES**

### **400 Bad Request - Invalid Status**
```json
{
  "message": "Trạng thái không hợp lệ",
  "validStatuses": ["Chờ duyệt", "Đang hoạt động", "Ngừng hoạt động", "Đã hủy"]
}
```

### **400 Bad Request - Invalid Transition (Agency)**
```json
{
  "message": "Agency không thể chuyển từ 'Đang hoạt động' sang 'Đã hủy'",
  "allowedStatuses": ["Ngừng hoạt động"]
}
```

### **403 Forbidden - No Permission**
```json
{
  "message": "Không có quyền sửa tour này"
}
```

### **404 Not Found - Tour Not Exists**
```json
{
  "message": "Không tìm thấy tour"
}
```

---

## 🧪 **TESTING EXAMPLES**

### **Test Case 1: Admin Approves Tour**
```bash
curl -X PATCH http://localhost:5001/api/tours/7ecdae58-fa8c-44fc-84a6-14f50338350a/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "status": "Đang hoạt động",
    "reason": "Tour thông tin đầy đủ và chất lượng"
  }'
```

### **Test Case 2: Agency Suspends Own Tour**
```bash
curl -X PATCH http://localhost:5001/api/tours/7ecdae58-fa8c-44fc-84a6-14f50338350a/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <agency_token>" \
  -d '{
    "status": "Ngừng hoạt động",
    "reason": "Tạm ngừng để cập nhật thông tin"
  }'
```

### **Test Case 3: Admin Rejects Tour**
```bash
curl -X PATCH http://localhost:5001/api/tours/7ecdae58-fa8c-44fc-84a6-14f50338350a/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "status": "Đã hủy",
    "reason": "Thông tin tour không đầy đủ, thiếu hình ảnh"
  }'
```

---

## 🔄 **WORKFLOW INTEGRATION**

### **Complete Tour Approval Flow**
```
1. 🏢 Agency creates tour → status: "Chờ duyệt"
2. 👨‍💼 Admin reviews → PATCH /api/tours/:id/status
3a. ✅ Admin approves → status: "Đang hoạt động" + email to agency
3b. ❌ Admin rejects → status: "Đã hủy" + email with reason
4. 🏢 Agency can resubmit → status: "Chờ duyệt" (if rejected)
5. 🔄 Ongoing management → suspend/reactivate as needed
```

### **Frontend Integration Points**
```javascript
// Admin Dashboard
GET /api/tours?status=Chờ duyệt          // Pending approvals
PATCH /api/tours/:id/status              // Approve/reject

// Agency Dashboard  
GET /api/tours/my-agency                 // My tours
PATCH /api/tours/:id/status              // Suspend/resubmit
```

---

## 🚨 **IMPORTANT NOTES**

1. **Database Transaction**: Tất cả operations được wrapped trong transaction
2. **Audit Logging**: Console logs track all status changes với user info
3. **Error Handling**: Comprehensive error handling với specific messages
4. **Performance**: Optimized queries với selective includes
5. **Security**: Role-based permissions với ownership validation

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues**
- **"Cannot PATCH" error**: Đảm bảo server đã restart sau khi thêm endpoint
- **403 Permission error**: Check JWT token và user role
- **400 Invalid transition**: Review status transition rules
- **Email not sent**: Check mailer configuration và agency email

### **Debug Commands**
```bash
# Check tour current status
GET /api/tours/:id

# Check user permissions
GET /api/auth/me

# Monitor server logs
tail -f server.log | grep "Tour.*status"
```
