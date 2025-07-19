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
1. Create main Tour record
2. Create TourImage records (if images provided)
3. Create DepartureDate records (if departureDates provided)
4. Validate & Associate IncludedServices (many-to-many)
5. Validate & Associate Categories (many-to-many)
6. Associate Hotels (many-to-many)
7. Return created tour with ID
```

---

## 🛠️ 3. TOUR ENDPOINTS - COMPLETE LIST

### **A. CRUD Operations**
```
GET    /api/tours                    // Lấy tất cả tours
GET    /api/tours/:id                // Lấy tour theo ID
POST   /api/tours                    // Tạo tour mới (Agency only)
PUT    /api/tours/:id                // Cập nhật tour (Agency only)
DELETE /api/tours/:id                // Xóa tour (Agency only)
```

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

### **E. Testing & Debug**
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

## 🎯 6. SUMMARY

**✅ Tour có đầy đủ CRUD operations**
**✅ Support many-to-many relations với Hotels, Categories, Services**  
**✅ Complete endpoint trả về full data**
**✅ Agency-specific endpoints với authentication**
**✅ Location/Destination search capabilities**
**✅ Promotion integration**

**Flow tạo tour: Auth → Validate → Create → Associate Relations → Response**
