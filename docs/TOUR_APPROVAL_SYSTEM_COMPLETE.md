# 🎯 TOUR APPROVAL SYSTEM - COMPLETE DOCUMENTATION

## 📋 Overview
Hệ thống tạo và duyệt tour với logic phân quyền rõ ràng giữa Admin và Agency.

---

## 🔄 Approval Flow

### 👨‍💼 **ADMIN Creates Tour:**
```javascript
// ✅ AUTO-APPROVED & ACTIVE
{
  "agency_id": "uuid-required",     // MUST specify which agency
  "name": "Tour Name",
  "status": "Đang hoạt động"        // Auto-set, immediate active
}
```

### 🏢 **AGENCY Creates Tour:**
```javascript
// ⏳ PENDING APPROVAL
{
  "name": "Tour Name",
  // agency_id: auto-assigned from user's agency
  // status: auto-set to "Chờ duyệt"
}
```

---

## 🛠️ API Endpoints

### 1. **Create Tour**
```http
POST /api/tours
Authorization: Bearer <token>
Content-Type: application/json
```

**Admin Request:**
```json
{
  "agency_id": "d3a463c7-fa0f-486c-8b89-8429c5640186",
  "name": "Tour Hạ Long Bay",
  "description": "Khám phá Vịnh Hạ Long tuyệt đẹp",
  "location": "Hạ Long",
  "destination": "Vịnh Hạ Long",
  "departure_location": "Hà Nội",
  "price": 2500000,
  "tour_type": "Trong nước",
  "max_participants": 30,
  "min_participants": 2,
  "images": [
    { "image_url": "https://example.com/halong1.jpg", "is_main": true }
  ],
  "departureDates": [
    {
      "departure_date": "2025-08-15",
      "end_date": "2025-08-17",
      "number_of_days": 3,
      "number_of_nights": 2
    }
  ],
  "category_ids": [1, 2],
  "hotel_ids": [1, 2],
  "included_service_ids": [1, 2, 3],
  "excluded_service_ids": [1, 2]
}
```

**Agency Request:**
```json
{
  // NO agency_id - auto-assigned
  "name": "Tour Sapa",
  "description": "Chinh phục đỉnh Fansipan",
  "location": "Sapa",
  "destination": "Núi Fansipan",
  "departure_location": "Hà Nội",
  "price": 1800000,
  "tour_type": "Trong nước",
  "max_participants": 20,
  "min_participants": 2,
  "category_ids": [2],
  "hotel_ids": [2],
  "included_service_ids": [1, 2]
}
```

**Response:**
```json
{
  "id": "tour-uuid",
  "name": "Tour Name",
  "status": "Đang hoạt động",  // Admin
  // or
  "status": "Chờ duyệt",       // Agency
  "agency_id": "agency-uuid",
  // ... other fields
}
```

---

### 2. **Approve/Reject Tour (Admin Only)**
```http
PATCH /api/tours/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Approve Tour:**
```json
{
  "status": "Đang hoạt động",
  "reason": "Tour đạt tiêu chuẩn và được phê duyệt"
}
```

**Reject Tour:**
```json
{
  "status": "Đã hủy",
  "reason": "Tour không đạt tiêu chuẩn chất lượng"
}
```

**Response:**
```json
{
  "id": "tour-uuid",
  "status": "Đang hoạt động", // Updated status
  "message": "Cập nhật trạng thái thành công"
}
```

---

### 3. **Get Tours with Status Filter**
```http
GET /api/tours?status=Chờ duyệt
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by tour status
- `page`: Pagination page number
- `limit`: Items per page
- `search`: Search by name/destination

---

## 📊 Status Values

| Status | Description | Who Can Set | Notes |
|--------|-------------|-------------|-------|
| `Chờ duyệt` | Pending approval | System (Agency) | Default for agency tours |
| `Đang hoạt động` | Active/Approved | System (Admin), Admin | Default for admin tours |
| `Ngừng hoạt động` | Paused | Admin, Agency | Temporarily inactive |
| `Đã hủy` | Rejected/Cancelled | Admin | Permanently rejected |

---

## 🔐 Permission Matrix

### **Admin Capabilities:**
- ✅ Create tour for any agency (must specify `agency_id`)
- ✅ Tours auto-approved (`Đang hoạt động`)
- ✅ Can change any tour status
- ✅ Can approve/reject agency tours
- ✅ View all tours regardless of agency

### **Agency Capabilities:**
- ✅ Create tour for own agency only (auto-assign `agency_id`)
- ✅ Tours need approval (`Chờ duyệt`)
- ⚠️ Limited status changes (cannot self-approve)
- ✅ View only own tours
- ✅ Can pause own tours (`Ngừng hoạt động`)

### **Agency Status Change Rules:**
```javascript
const allowedChanges = {
  'Chờ duyệt': ['Ngừng hoạt động'],           // Can withdraw
  'Đang hoạt động': ['Ngừng hoạt động'],       // Can pause
  'Ngừng hoạt động': ['Chờ duyệt']            // Can resubmit
};
```

---

## 🚀 Implementation Details

### **Controller Logic (tourController.js):**
```javascript
// Auto-approval logic
if (req.user?.role === 'admin') {
  tourData.status = 'Đang hoạt động'; // Auto-approved
  console.log("🔰 Admin tạo tour - AUTO APPROVED & ACTIVE");
  
} else if (req.user?.role === 'agency') {
  tourData.status = 'Chờ duyệt'; // Pending approval
  console.log("⏳ Agency tạo tour - PENDING APPROVAL");
}
```

### **Route Protection (tourRoutes.js):**
```javascript
// Create tour - both admin and agency
router.post("/", 
  protect(["admin", "agency"]),
  (req, res, next) => {
    if (req.user.role === 'agency') {
      return ensureAgencyApproved(req, res, next);
    }
    next(); // Admin bypasses approval check
  },
  tourController.create
);

// Update status - admin only for approval
router.patch("/:id/status",
  protect(["admin", "agency"]), // Agency has limited permissions
  tourController.updateStatus
);
```

---

## 📧 Email Notifications

When admin approves/rejects a tour, the system automatically sends email to agency:

- **Approved:** "Tour đã được duyệt"
- **Rejected:** "Tour bị từ chối" (with reason)

---

## 🧪 Testing

Run the test suite:
```bash
node test_tour_approval_flow.js
```

Test scenarios:
1. ✅ Admin creates auto-approved tour
2. ✅ Agency creates pending tour  
3. ✅ Admin approves agency tour
4. ✅ Admin rejects agency tour
5. ✅ Status filtering works correctly

---

## 🎯 Summary

| User Type | Tour Status | Approval Required | Can Approve Others |
|-----------|-------------|-------------------|-------------------|
| **Admin** | `Đang hoạt động` | ❌ No (Auto) | ✅ Yes |
| **Agency** | `Chờ duyệt` | ✅ Yes | ❌ No |

**✅ System is production-ready with complete approval workflow!**
