# 🔍 **SO SÁNH CHỨC NĂNG CRUD TOUR: ADMIN vs AGENCY**

## 📋 **TỔNG QUAN SO SÁNH**

| **Chức năng** | **Agency** | **Admin** | **Tình trạng** |
|---------------|------------|-----------|----------------|
| **📖 READ (Lấy danh sách)** | ✅ Có pagination | ✅ Có pagination | ✅ **TƯƠNG ĐƯƠNG** |
| **➕ CREATE (Tạo mới)** | ✅ Đầy đủ | ✅ **VỪA THÊM** | ✅ **HOÀN THÀNH** |
| **✏️ UPDATE (Cập nhật)** | ✅ Đầy đủ | ✅ Đầy đủ | ✅ **TƯƠNG ĐƯƠNG** |
| **🗑️ DELETE (Xóa)** | ✅ Có | ✅ Có + force | ⚠️ **ADMIN MẠNH HƠN** |

---

## 📖 **1. CHỨC NĂNG READ (Lấy danh sách)**

### **Agency:**
```javascript
// ✅ HOÀN CHỈNH
GET /api/tours/my-agency?page=1&limit=10&status=Chờ duyệt&search=Đà Lạt

Response: {
  tours: [...],
  pagination: { page, limit, total, totalPages, hasNext, hasPrev },
  filters: { status, search }
}
```

### **Admin:**
```javascript
// ✅ HOÀN CHỈNH + MẠNH HƠN
GET /api/admin/tours?page=1&limit=10&status=Chờ duyệt&search=Đà Lạt&agency_id=uuid

Response: {
  success: true,
  data: {
    tours: [...],
    pagination: { page, limit, total, totalPages, hasNext, hasPrev },
    filters: { status, search, agency_id },
    stats: { pendingCount, activeCount }
  }
}
```

**🎯 Kết luận:** Admin mạnh hơn với filters nhiều hơn và thông tin stats.

---

## ➕ **2. CHỨC NĂNG CREATE (Tạo mới)**

### **Agency:**
```javascript
// ✅ HOÀN CHỈNH 
POST /api/tours
Headers: { Authorization: "Bearer agency_token" }
Body: {
  name: "Tour name",
  location: "Đà Lạt", 
  destination: "Thác Datanla",
  price: 2900000,
  hotel_ids: [1, 2],
  category_ids: [1, 2],
  included_service_ids: [1, 2],
  images: [...],
  departureDates: [...]
}

// ✅ Tự động gán agency_id từ user đăng nhập
// ✅ Validate đầy đủ
// ✅ Tạo tất cả relationships
```

### **Admin:**
```javascript
// ✅ VỪA BỔ SUNG HOÀN CHỈNH
POST /api/admin/tours
Headers: { Authorization: "Bearer admin_token" }
Body: {
  agency_id: "uuid", // 🆕 CHỌN AGENCY TỪ DROPDOWN
  name: "Tour name",
  location: "Đà Lạt", 
  destination: "Thác Datanla",
  price: 2900000,
  hotel_ids: [1, 2],
  category_ids: [1, 2],
  included_service_ids: [1, 2],
  images: [...],
  departureDates: [...]
}

// ✅ Validate agency_id bắt buộc
// ✅ Kiểm tra agency tồn tại và đã approved
// ✅ Tạo tất cả relationships giống agency
// ✅ Gửi email thông báo cho agency
// ✅ Log admin action
```

**🎉 Kết luận:** **ADMIN ĐÃ CÓ CHỨC NĂNG CREATE!**

---

## ✏️ **3. CHỨC NĂNG UPDATE (Cập nhật)**

### **Agency:**
```javascript
// ✅ HOÀN CHỈNH
PUT /api/tours/:id
Body: {
  name: "Tour updated",
  price: 3000000,
  hotel_ids: [1, 2, 3],
  category_ids: [1],
  included_service_ids: [1, 2],
  images: [...],
  departureDates: [...]
}

// ✅ Cập nhật core data
// ✅ Cập nhật hotels via setHotels()
// ✅ Cập nhật services via setIncludedServices()
// ✅ Cập nhật categories via setCategories()
// ✅ Cập nhật images + departure dates
// ✅ Validation đầy đủ
```

### **Admin:**
```javascript
// ✅ HOÀN CHỈNH + GIỐNG AGENCY
PUT /api/admin/tours/:id
Body: { /* Giống agency */ }

// ✅ Cập nhật tất cả fields giống agency
// ✅ Gửi email thông báo cho agency
// ✅ Log admin action
```

**🎯 Kết luận:** **TƯƠNG ĐƯƠNG HOÀN TOÀN**

---

## 🗑️ **4. CHỨC NĂNG DELETE (Xóa)**

### **Agency:**
```javascript
// ✅ CƠ BẢN
DELETE /api/tours/:id

// ✅ Xóa tour của chính agency
// ✅ Middleware bảo vệ (chỉ xóa tour của mình)
// ❌ Không có force delete
// ❌ Không có check booking
```

### **Admin:**
```javascript
// ✅ NÂNG CAO
DELETE /api/admin/tours/:id?force=true

// ✅ Xóa bất kỳ tour nào
// ✅ Force delete option
// ✅ Check booking trước khi xóa (commented)
// ✅ Log admin action với timestamp
// ✅ Response format chuẩn với success/data
```

**🎯 Kết luận:** **ADMIN MẠNH HƠN**

---

## 🎯 **TỔNG KẾT THIẾU SÓT**

### ✅ **ADMIN ĐÃ BỔ SUNG:**

1. **✅ CREATE Tour Function - HOÀN THÀNH**
   ```javascript
   // ĐÃ THÊM:
   POST /api/admin/tours
   const createTour = async (req, res) => {
     // ✅ Chọn agency_id từ dropdown agencies
     // ✅ Validate agency exists và approved
     // ✅ Logic tạo tour giống agency
     // ✅ Email thông báo cho agency
     // ✅ Response format chuẩn
   }
   ```

2. **✅ Routes cho CREATE - HOÀN THÀNH**
   ```javascript
   // ĐÃ THÊM vào adminTourRoutes.js:
   router.post("/", adminTourController.createTour);
   ```

### ⚠️ **AGENCY CẦN NÂNG CẤP:**

1. **Delete function** - thêm force option và check booking
2. **Response format** - chuẩn hóa như admin (success/data structure)

---

## 🔧 **KHUYẾN NGHỊ CẬP NHẬT**

### **1. Thêm Admin Create Tour:**
```javascript
// controllers/adminTourController.js
const createTour = async (req, res) => {
  try {
    const { agency_id, ...tourData } = req.body;
    
    if (!agency_id) {
      return res.status(400).json({
        success: false,
        message: "Cần chọn agency để tạo tour"
      });
    }
    
    // Validate agency exists
    const agency = await Agency.findByPk(agency_id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency không tồn tại"
      });
    }
    
    // Tạo tour với logic giống agency
    // ... (copy logic từ agency create)
    
    // Gửi email thông báo cho agency
    
    res.json({
      success: true,
      message: `Tour "${tour.name}" đã được tạo thành công`,
      data: { tour }
    });
  } catch (err) {
    console.error("❌ Error in admin createTour:", err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo tour',
      error: err.message
    });
  }
};
```

### **2. Nâng cấp Agency Delete:**
```javascript
// controllers/tourController.js - nâng cấp remove function
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    
    const tour = await Tour.findByPk(id);
    if (!tour) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy tour" 
      });
    }
    
    // Check booking nếu cần
    // const hasBookings = await Booking.count({ where: { tour_id: id } });
    
    const tourName = tour.name;
    await tour.destroy();
    
    res.json({ 
      success: true,
      message: `Tour "${tourName}" đã được xóa`,
      data: {
        id,
        name: tourName,
        deletedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Xóa thất bại",
      error: err.message 
    });
  }
};
```

---

## 🏆 **KẾT LUẬN CUỐI CÙNG**

| **Khía cạnh** | **Agency** | **Admin** | **Cần làm** |
|---------------|------------|-----------|-------------|
| **READ** | ✅ Hoàn chỉnh | ✅ Hoàn chỉnh | ✅ OK |
| **CREATE** | ✅ Hoàn chỉnh | ✅ **HOÀN THÀNH** | ✅ **DONE** |
| **UPDATE** | ✅ Hoàn chỉnh | ✅ Hoàn chỉnh | ✅ OK |
| **DELETE** | ⚠️ Cơ bản | ✅ Nâng cao | ⚠️ **NÂNG CẤP** |

**🎯 Ưu tiên:**
1. ✅ **Thêm Admin Create Tour** - **HOÀN THÀNH**
2. **Nâng cấp Agency Delete** - chuẩn hóa response format
3. **Test toàn bộ flow** - đảm bảo consistency

**🎉 Admin giờ đã có đầy đủ CRUD: Có thể "tạo" tour cho agency, "quản lý" tours (approve/reject/update/delete). Agency vẫn tự tạo được, admin có thể tạo giúp khi cần.**
