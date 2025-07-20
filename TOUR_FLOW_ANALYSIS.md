# 🎯 FLOW THÊM TOUR & ENDPOINTS RELATION - BE TOUR BOOKING

## 📋 1. TOUR MODEL - CÁC TRƯỜNG DỮ LIỆU

### **Tour Fields (Bảng `tour`)**
```javascript
{
  id: UUID (Primary Key),
  agency_id: UUID (Foreign Key to Agency),
  name: STRING (Required),
  description: TEXT,
  location: STRING,
  destination: STRING,
  departure_location: STRING,
  price: FLOAT,
  promotion_id: UUID (Foreign Key to Promotion),
  tour_type: ENUM('Trong nước', 'Quốc tế'),
  max_participants: INTEGER (Required),
  min_participants: INTEGER (Default: 1),
  status: ENUM('Chờ duyệt', 'Đang hoạt động', 'Ngừng hoạt động', 'Đã hủy')
}
```

### **Tour Relations (Associations)**
```javascript
// One-to-Many
Tour.hasMany(DepartureDate)      // Tour → Ngày khởi hành
Tour.hasMany(TourImage)          // Tour → Hình ảnh
Tour.hasMany(Itinerary)          // Tour → Hành trình
Tour.hasMany(Review)             // Tour → Đánh giá

// Many-to-One
Tour.belongsTo(Agency)           // Tour → Agency
Tour.belongsTo(Promotion)        // Tour → Khuyến mãi

// Many-to-Many
Tour.belongsToMany(Hotel)              // Tour ↔ Khách sạn
Tour.belongsToMany(TourCategory)       // Tour ↔ Danh mục
Tour.belongsToMany(IncludedService)    // Tour ↔ Dịch vụ bao gồm
Tour.belongsToMany(ExcludedService)    // Tour ↔ Dịch vụ loại trừ
```

---

## 🚀 2. FLOW THÊM TOUR (CREATE TOUR)

### **Step 1: Authentication & Authorization**
```
POST /api/tours
Headers: Authorization: Bearer <token>
Middleware: protect(["agency"]) + ensureAgencyApproved
```

**Business Rules:**
- Chỉ Agency đã được Admin approve mới tạo được tour
- Tour mới tạo có status mặc định = "Chờ duyệt"
- Agency chỉ có thể tạo tour cho chính mình

### **Step 2: Request Body Structure**
```javascript
{
  // Core tour data
  name: "Tour khám phá Đà Lạt 3N2Đ",
  description: "Hành trình khám phá...",
  location: "Đà Lạt",
  destination: "Thác Datanla, Chợ Đà Lạt",
  departure_location: "TP. Hồ Chí Minh",
  price: 3200000,
  tour_type: "Trong nước",
  max_participants: 10,
  min_participants: 1,
  
  // Related data arrays
  images: [
    { image_url: "https://...", is_main: true },
    { image_url: "https://...", is_main: false }
  ],
  
  departureDates: [
    { departure_date: "2025-08-15", end_date: "2025-08-17", number_of_days: 3, number_of_nights: 2 }
  ],
  
  selectedIncludedServices: ["service_id_1", "service_id_2"],
  selectedCategories: ["category_id_1", "category_id_2"],
  
  // Alternative naming
  hotel_ids: ["hotel_id_1"],
  category_ids: ["category_id_1"],
  included_service_ids: ["service_id_1"]
}
```

### **Step 3: Processing Flow**
```javascript
1. Validate Agency permissions (ensureAgencyApproved middleware)
2. Create main Tour record with status: "Chờ duyệt"
3. Create TourImage records (if images provided)
4. Create DepartureDate records (if departureDates provided)
5. Validate & Associate IncludedServices (many-to-many)
6. Validate & Associate Categories (many-to-many)
7. Associate Hotels (many-to-many)
8. Send notification to Admin about new tour pending approval
9. Return created tour with ID
```

### **Step 4: Admin Approval Process**
```javascript
// Admin xem tours cần duyệt
GET /api/admin/tours?status=Chờ duyệt

// Admin duyệt tour
PUT /api/admin/tours/:id/approve
→ status: "Đang hoạt động"
→ Email notification to Agency

// Admin từ chối tour  
PUT /api/admin/tours/:id/reject
Body: { reason: "Thông tin không đầy đủ" }
→ status: "Đã hủy"
→ Email notification to Agency with reason
```

---

## 🛠️ 3. TOUR ENDPOINTS - COMPLETE LIST

### **A. CRUD Operations**
```
GET    /api/tours                    // Lấy tất cả tours (phân quyền theo role)
GET    /api/tours/:id                // Lấy tour theo ID
POST   /api/tours                    // Tạo tour mới (Agency only) → status: "Chờ duyệt"
PUT    /api/tours/:id                // Cập nhật tour (Agency: own tours only)
DELETE /api/tours/:id                // Xóa tour (Agency: conditional, Admin: conditional)
```

**Agency CRUD Rules:**
- **READ**: Chỉ xem tours của mình
- **CREATE**: Tour mới → status "Chờ duyệt"
- **UPDATE**: Chỉ sửa tours của mình, giới hạn theo status
- **DELETE**: Chỉ xóa tours không có booking

### **B. Tour Relations - Individual**
```
GET /api/tours/:id/departures        // Tour + Departure Dates
GET /api/tours/:id/categories        // Tour + Categories
GET /api/tours/:id/included-services // Tour + Included Services
GET /api/tours/:id/hotels            // Tour + Hotels
GET /api/tours/:id/excluded-services // Tour + Excluded Services
GET /api/tours/:id/itineraries       // Tour + Itineraries
GET /api/tours/:id/complete          // Tour + ALL Relations
GET /api/tours/:tourId/complete      // Alias for complete
```

### **C. Assignment Operations (Many-to-Many)**
```
POST /api/tours/:tourId/included-services/:serviceId  // Gán dịch vụ
POST /api/tours/:tourId/excluded-services/:serviceId  // Gán dịch vụ loại trừ  
POST /api/tours/:tourId/hotels/:hotelId               // Gán khách sạn
```

### **D. Special Query Endpoints**
```
GET /api/tours/my-agency              // Tours của agency hiện tại
GET /api/tours/with-promotions        // Tours có promotion active
GET /api/tours/location/:locationId   // Tours theo location
GET /api/tours/destination/:destinationId  // Tours theo destination
```

### **E. Admin Management Endpoints**
```
# Quản lý duyệt tour
GET /api/admin/tours                  // Xem tất cả tours (có filter status)
PUT /api/admin/tours/:id/approve      // Duyệt tour
PUT /api/admin/tours/:id/reject       // Từ chối tour
PUT /api/admin/tours/:id/status       // Thay đổi trạng thái tour

# Bulk operations
PUT /api/admin/tours/bulk/status      // Cập nhật trạng thái hàng loạt
DELETE /api/admin/tours/bulk          // Xóa hàng loạt
```

### **F. Testing & Debug**
```
GET /api/tours/test-log               // Test endpoint
```

---

## 🔄 4. RELATION TABLES (Junction Tables)

### **Many-to-Many Relations**
```sql
tour_hotel              // Tour ↔ Hotel
tour_tour_category      // Tour ↔ TourCategory  
tour_included_service   // Tour ↔ IncludedService
tour_excluded_service   // Tour ↔ ExcludedService
itinerary_location      // Itinerary ↔ Location (for tour search)
```

---

## 📊 5. COMPLETE TOUR RESPONSE STRUCTURE

### **GET /api/tours/:id/complete Response:**
```javascript
{
  id: "tour-uuid",
  name: "Tour Name",
  description: "...",
  location: "Đà Lạt",
  destination: "Thác Datanla",
  price: 3200000,
  status: "Đang hoạt động",
  
  // Relations
  agency: { id: "...", name: "Agency Name" },
  promotion: { id: "...", code: "SALE10", discount_amount: 10 },
  
  departureDates: [
    { id: "...", departure_date: "2025-08-15", number_of_days: 3 }
  ],
  
  images: [
    { id: "...", image_url: "https://...", is_main: true }
  ],
  
  categories: [
    { id: "...", name: "Du lịch sinh thái" }
  ],
  
  includedServices: [
    { id: "...", service_name: "Vé tham quan" }
  ],
  
  excludedServices: [
    { id: "...", service_name: "Đồ uống cá nhân" }
  ],
  
  hotels: [
    { id: "...", name: "Hotel ABC", address: "..." }
  ],
  
  itineraries: [
    { id: "...", day_number: 1, title: "Ngày 1", description: "..." }
  ],
  
  reviews: [
    { id: "...", rating: 5, comment: "Tuyệt vời!" }
  ]
}
```

---

## 🎯 6. FLOW QUẢN LÝ TOUR GIỮA AGENCY VÀ ADMIN

### **Tour Status Workflow**
```
Agency tạo tour → status: "Chờ duyệt"
        ↓
Admin xem review → 
        ↓
   [APPROVE] → status: "Đang hoạt động" → Tour có thể được book
        ↓
   [REJECT] → status: "Đã hủy" + lý do
        ↓
Agency/Admin có thể:
   - Ngừng hoạt động (tạm thời)
   - Mở lại hoạt động  
   - Xóa vĩnh viễn (nếu không có booking)
```

### **🏢 Agency Permissions**
```javascript
const agencyPermissions = {
  create: true,           // Tạo tour mới
  read: "own_tours_only", // Chỉ xem tours của mình
  update: {
    "Chờ duyệt": "full_edit",      // Sửa toàn bộ
    "Đang hoạt động": "limited",    // Sửa giới hạn (price, description)
    "Ngừng hoạt động": false,       // Không sửa được
    "Đã hủy": false                 // Không sửa được
  },
  delete: {
    "Chờ duyệt": true,              // Xóa được
    "Đang hoạt động": "conditional", // Không xóa được nếu có booking
    "Ngừng hoạt động": "conditional", // Xóa được nếu không có booking
    "Đã hủy": false                 // Không xóa được
  },
  status_change: {
    "Chờ duyệt": ["Ngừng hoạt động"], 
    "Đang hoạt động": ["Ngừng hoạt động"],
    "Ngừng hoạt động": ["Chờ duyệt"] // Có thể đưa lại chờ duyệt
  }
};
```

### **👨‍💼 Admin Permissions**
```javascript
const adminPermissions = {
  create: false,          // Admin không tạo tour
  read: "all_tours",      // Xem tất cả tours
  update: "full_access",  // Sửa bất kỳ tour nào
  delete: "conditional",  // Xóa nếu không có booking
  status_change: {
    "Chờ duyệt": ["Đang hoạt động", "Đã hủy"],
    "Đang hoạt động": ["Ngừng hoạt động", "Đã hủy"], 
    "Ngừng hoạt động": ["Đang hoạt động", "Đã hủy"],
    "Đã hủy": ["Chờ duyệt"] // Có thể khôi phục
  }
};
```

### **🔄 Admin Tour Management Endpoints**
```http
# Duyệt/Từ chối tour
PUT /api/admin/tours/:id/approve     # Duyệt tour
PUT /api/admin/tours/:id/reject      # Từ chối tour + lý do

# Quản lý trạng thái
PUT /api/admin/tours/:id/status      # Đóng/Mở tour
Body: { status: "Ngừng hoạt động", reason: "Vi phạm quy định" }

# Xem tours cần duyệt  
GET /api/admin/tours?status=Chờ duyệt

# Bulk operations
PUT /api/admin/tours/bulk/status     # Cập nhật hàng loạt
DELETE /api/admin/tours/bulk         # Xóa hàng loạt
```

### **📧 Notification System**
```javascript
const notifications = {
  tour_created: "Admin nhận thông báo có tour mới cần duyệt",
  tour_approved: "Agency nhận thông báo tour được duyệt", 
  tour_rejected: "Agency nhận thông báo tour bị từ chối + lý do",
  tour_suspended: "Agency nhận thông báo tour bị ngừng hoạt động",
  tour_reactivated: "Agency nhận thông báo tour được mở lại"
};
```

### **🛡️ Business Rules**
1. **Agency chỉ có thể quản lý tours của mình**
2. **Admin có thể duyệt/từ chối tours**
3. **Tours phải có ít nhất 1 departure date**
4. **Không thể xóa tour đã có booking**
5. **Tour "Chờ duyệt" mặc định khi tạo mới**
6. **Auto-status management workflow**

---

## 🎯 7. SUMMARY

**✅ Tour có đầy đủ CRUD operations**
**✅ Support many-to-many relations với Hotels, Categories, Services**  
**✅ Complete endpoint trả về full data**
**✅ Agency-specific endpoints với authentication**
**✅ Location/Destination search capabilities**
**✅ Promotion integration**
**✅ Admin approval workflow**
**✅ Status management system**
**✅ Notification system**

**Flow tạo tour: Auth → Validate → Create → Associate Relations → Admin Approval → Active/Rejected**
