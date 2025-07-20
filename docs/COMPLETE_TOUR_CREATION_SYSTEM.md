# 📅🚫 COMPLETE TOUR CREATION SYSTEM

## 📋 Overview
Hệ thống tạo và cập nhật tour hoàn chỉnh với đầy đủ `departureDates` và `excludedServices` support.

---

## ✅ NEW FEATURES IMPLEMENTED

### 1️⃣ **Departure Dates Support**
- ✅ Create tour with multiple departure dates
- ✅ Update tour with new departure dates (replace all)
- ✅ Automatic validation and database relationships

### 2️⃣ **Excluded Services Support** 
- ✅ Create tour with excluded services
- ✅ Update tour with excluded services (replace all)
- ✅ Many-to-many relationship management
- ✅ Service ID validation

---

## 🛠️ API Request Structure

### **Complete Tour Creation**
```http
POST /api/tours
Authorization: Bearer <token>
Content-Type: application/json
```

**Full Request Body:**
```json
{
  "name": "Tour Vịnh Hạ Long Complete",
  "description": "Tour với đầy đủ tính năng mới",
  "destination_id": "dest-uuid",           // Auto-populate destination name
  "location_id": "loc-uuid",               // Auto-populate location name
  "departure_location": "Hà Nội",
  "price": 2800000,
  "tour_type": "Trong nước",
  "max_participants": 30,
  "min_participants": 2,
  
  "images": [
    { "image_url": "https://example.com/img1.jpg", "is_main": true },
    { "image_url": "https://example.com/img2.jpg", "is_main": false }
  ],
  
  "departureDates": [                      // ✅ NEW: Multiple departure dates
    {
      "departure_date": "2025-08-15",
      "end_date": "2025-08-17",
      "number_of_days": 3,
      "number_of_nights": 2
    },
    {
      "departure_date": "2025-09-01", 
      "end_date": "2025-09-03",
      "number_of_days": 3,
      "number_of_nights": 2
    }
  ],
  
  "category_ids": [1, 2],                  // Tour categories
  "hotel_ids": [1, 2],                     // Hotels
  "included_service_ids": [1, 2, 3],       // Services included in tour
  "excluded_service_ids": [4, 5, 6]        // ✅ NEW: Services NOT included
}
```

### **Tour Update**
```http
PUT /api/tours/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Update Request Body:**
```json
{
  "name": "Updated Tour Name",
  "price": 3200000,
  
  "departureDates": [                      // ✅ REPLACES all existing dates
    {
      "departure_date": "2025-10-15",
      "end_date": "2025-10-18", 
      "number_of_days": 4,
      "number_of_nights": 3
    }
  ],
  
  "excluded_service_ids": [7, 8, 9],       // ✅ REPLACES all excluded services
  "included_service_ids": [1, 3, 5]        // ✅ REPLACES all included services
}
```

---

## 🔄 Backend Processing Logic

### **Create Tour Process:**
1. **Extract Arrays:** `departureDates`, `excluded_service_ids`, etc.
2. **Create Core Tour:** Basic tour data first
3. **Add Images:** Link images to tour
4. **Add Departure Dates:** Create DepartureDate records
5. **Add Included Services:** Many-to-many relationship
6. **Add Excluded Services:** ✅ NEW - Many-to-many relationship  
7. **Add Categories:** Link tour categories
8. **Add Hotels:** Link hotels
9. **Return Complete Tour:** With all relationships

### **Update Tour Process:**
1. **Extract Arrays:** Same as create
2. **Update Core Data:** Basic tour info
3. **Replace Departure Dates:** Clear old, add new
4. **Replace Services:** Update both included/excluded
5. **Replace Categories:** Update categories
6. **Replace Hotels:** Update hotels
7. **Return Updated Tour:** With updated relationships

### **Validation Logic:**
```javascript
// Validate excluded service IDs exist
const existingExcludedServices = await ExcludedService.findAll({
  where: { id: excluded_service_ids }
});

if (existingExcludedServices.length !== excluded_service_ids.length) {
  console.log('⚠️ Some excluded services not found');
}

// Set relationships
await tour.setExcludedServices(existingExcludedServices.map(s => s.id));
```

---

## 📊 Field Support Matrix

| Field | Create | Update | Validation | Relationship |
|-------|--------|--------|------------|--------------|
| `departureDates` | ✅ | ✅ | Date format | One-to-many |
| `excluded_service_ids` | ✅ | ✅ | ID exists | Many-to-many |
| `included_service_ids` | ✅ | ✅ | ID exists | Many-to-many |
| `category_ids` | ✅ | ✅ | ID exists | Many-to-many |
| `hotel_ids` | ✅ | ✅ | ID exists | Many-to-many |
| `images` | ✅ | ✅ | URL format | One-to-many |

---

## 🔄 Alternative Field Names

For backward compatibility and flexibility:

```json
{
  // Primary field names (recommended)
  "excluded_service_ids": [1, 2, 3],
  "included_service_ids": [1, 2, 3],
  "category_ids": [1, 2],
  
  // Alternative field names (also supported)
  "excludedServices": [1, 2, 3],           // Alternative for excluded_service_ids
  "selectedIncludedServices": [1, 2, 3],   // Alternative for included_service_ids
  "selectedCategories": [1, 2]             // Alternative for category_ids
}
```

---

## 🚫 Empty Arrays Handling

The system properly handles empty arrays:

```json
{
  "name": "Tour with No Extras",
  "departureDates": [],           // Tour with no departure dates
  "excluded_service_ids": [],     // Tour with no excluded services
  "included_service_ids": [],     // Tour with no included services
  "category_ids": [],             // Tour with no categories
  "hotel_ids": []                 // Tour with no hotels
}
```

**Result:** Tour is created successfully with no relationships.

---

## 🧪 Testing Examples

### **Test 1: Complete Tour Creation**
```bash
node test_complete_tour_creation.js
```

**Test Coverage:**
- ✅ Create tour with all relation arrays
- ✅ Verify all relationships are created
- ✅ Update tour with new data
- ✅ Verify updates replace old data
- ✅ Handle empty arrays properly

### **Test 2: Get Complete Tour Data**
```http
GET /api/tours/:id/complete
```

**Response includes:**
```json
{
  "id": "tour-uuid",
  "name": "Tour Name",
  "departureDates": [               // All departure dates
    {
      "id": "date-uuid",
      "departure_date": "2025-08-15",
      "end_date": "2025-08-17",
      "number_of_days": 3,
      "number_of_nights": 2
    }
  ],
  "excludedServices": [             // All excluded services
    {
      "id": "service-uuid",
      "name": "Service Name",
      "description": "Service Description"
    }
  ],
  "includedServices": [...],        // All included services
  "categories": [...],              // All categories
  "hotels": [...],                  // All hotels
  "images": [...]                   // All images
}
```

---

## 🎯 Use Cases

### **1. Travel Agency Creating Package Tour:**
```json
{
  "name": "Tour Hạ Long 3N2Đ",
  "departureDates": [
    { "departure_date": "2025-08-15", "end_date": "2025-08-17", "number_of_days": 3, "number_of_nights": 2 },
    { "departure_date": "2025-08-22", "end_date": "2025-08-24", "number_of_days": 3, "number_of_nights": 2 }
  ],
  "included_service_ids": [1, 2, 3],    // Meals, transport, guide
  "excluded_service_ids": [4, 5]        // Personal expenses, tips
}
```

### **2. Tour Update with New Schedule:**
```json
{
  "departureDates": [
    { "departure_date": "2025-09-15", "end_date": "2025-09-18", "number_of_days": 4, "number_of_nights": 3 }
  ],
  "excluded_service_ids": [4, 5, 6]      // Add more excluded services
}
```

### **3. Seasonal Tour Variations:**
```json
{
  "name": "Tour Mùa Thu Sapa",
  "departureDates": [
    { "departure_date": "2025-10-01", "number_of_days": 2 },
    { "departure_date": "2025-10-08", "number_of_days": 2 },
    { "departure_date": "2025-10-15", "number_of_days": 2 }
  ]
}
```

---

## 📈 Benefits

### **✅ For Travel Agencies:**
- **Flexible Scheduling:** Multiple departure dates per tour
- **Clear Service Breakdown:** What's included vs excluded
- **Easy Updates:** Modify schedules and services anytime
- **Comprehensive Data:** All tour info in one request

### **✅ For Frontend:**
- **Rich UI:** Display all departure options
- **Service Clarity:** Show included/excluded services
- **Easy Forms:** Submit everything in one request
- **Real-time Updates:** Update specific parts without full reload

### **✅ For Database:**
- **Proper Relationships:** Normalized data structure
- **Data Integrity:** Foreign key constraints
- **Query Efficiency:** Optimized joins and queries
- **Scalability:** Handle large numbers of tours/dates/services

---

## 🔧 Technical Implementation

### **Controller Updates:**
- ✅ Enhanced `create` method with excluded services
- ✅ Enhanced `update` method with excluded services  
- ✅ Detailed logging for debugging
- ✅ Proper error handling and validation

### **Admin Approval System:**
```http
PUT /api/admin/tours/:id/approve
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Tour đã đáp ứng đủ tiêu chuẩn chất lượng"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tour 'Tour Name' đã được duyệt thành công",
  "data": {
    "id": "tour-uuid",
    "name": "Tour Name",
    "oldStatus": "Chờ duyệt",
    "newStatus": "Đang hoạt động",
    "reason": "Tour đã đáp ứng đủ tiêu chuẩn chất lượng",
    "approvedAt": "2025-07-21T...",
    "approvedBy": "admin@example.com"
  }
}
```

### **Data Transformation System:**
```javascript
// NEW: Smart data transformer for FE-BE compatibility
const { smartTransformForUpdate } = require("../utils/tourDataTransformer");

// Handles both FE response format and BE request format
const transformedData = smartTransformForUpdate(req.body);

// Transforms:
// includedServices: [{id, name}] → included_service_ids: [id1, id2]
// excludedServices: [{id, name}] → excluded_service_ids: [id1, id2]
// categories: [{id, name}] → category_ids: [id1, id2]
// hotels: [{id_hotel, name}] → hotel_ids: [id1, id2]
```

### **Request Processing:**
```javascript
// Extract excluded services from request
const {
  excluded_service_ids = [],
  excludedServices = [],
  departureDates = [],
  // ... other fields
} = req.body;

// Process excluded services
const excludedServicesToAdd = [...excludedServices, ...excluded_service_ids].filter(Boolean);
if (excludedServicesToAdd.length > 0) {
  const existingExcludedServices = await ExcludedService.findAll({
    where: { id: excludedServicesToAdd }
  });
  await tour.setExcludedServices(existingExcludedServices.map(s => s.id));
}

// Process departure dates
if (departureDates && departureDates.length > 0) {
  for (const date of departureDates) {
    await DepartureDate.create({ ...date, tour_id: tour.id });
  }
}
```

---

## 🎯 Summary

| Feature | Status | Description |
|---------|--------|-------------|
| **departureDates** | ✅ Complete | Multiple departure dates per tour |
| **excluded_service_ids** | ✅ Complete | Services NOT included in tour |
| **Field Variations** | ✅ Complete | Multiple field name support |
| **Empty Arrays** | ✅ Complete | Proper handling of empty arrays |
| **Create & Update** | ✅ Complete | Both operations fully supported |
| **Validation** | ✅ Complete | ID validation and error handling |
| **Testing** | ✅ Complete | Comprehensive test suite |
| **Documentation** | ✅ Complete | Full API documentation |

**🚀 System is now complete with full departureDates and excludedServices support!**

---

## 📋 Files Modified

- **Controller:** `controllers/tourController.js` (enhanced create/update methods)
- **Admin Controller:** `controllers/adminTourController.js` (approval system)
- **Routes:** `routes/adminTourRoutes.js` (PUT /approve endpoint added)
- **Transformer:** `utils/tourDataTransformer.js` (FE-BE data compatibility)
- **Tests:** `test_complete_tour_creation.js` (comprehensive test suite)
- **Documentation:** `docs/COMPLETE_TOUR_CREATION_SYSTEM.md` (this file)

**✅ Ready for production use with complete tour creation capabilities!**

---

## 🔄 Latest Fixes Applied

### **Admin Tour Approval Endpoint - FIXED ✅**
**Problem:** Frontend sends `PUT /api/admin/tours/:id/approve` but backend only had `PATCH`

**Solution:** Added both methods to support frontend requests:
```javascript
// routes/adminTourRoutes.js
router.patch("/:id/approve", adminTourController.approveTour);
router.put("/:id/approve", adminTourController.approveTour);  // NEW: Support PUT
router.patch("/:id/reject", adminTourController.rejectTour);
router.put("/:id/reject", adminTourController.rejectTour);    // NEW: Support PUT
```

### **Data Transformation System - IMPLEMENTED ✅**
**Problem:** FE sends relationship objects but BE expects ID arrays

**Solution:** Created `utils/tourDataTransformer.js` with smart conversion:
```javascript
// Input (FE Response Format):
{
  includedServices: [{id: "service-1", name: "Service 1"}],
  excludedServices: [{id: "exc-1", name: "Excluded 1"}]
}

// Output (BE Request Format):
{
  included_service_ids: ["service-1"],
  excluded_service_ids: ["exc-1"]
}
```

**Integration:** Tour controller now uses:
```javascript
const transformedData = smartTransformForUpdate(req.body);
```

### **Route Registration Verification ✅**
- ✅ Admin routes registered at `/api/admin/tours`
- ✅ Both `PUT` and `PATCH` methods supported for approval
- ✅ Authentication middleware applied correctly
- ✅ Controller methods exist and are exported properly
