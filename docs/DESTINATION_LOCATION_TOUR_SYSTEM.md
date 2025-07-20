# 🌍 DESTINATION & LOCATION TOUR CREATION SYSTEM

## 📋 Overview
Hệ thống tạo và cập nhật tour với khả năng gán destination và location thông qua ID hoặc text trực tiếp.

---

## 🔄 Two Approaches

### 1️⃣ **ID-Based Approach (Recommended)**
```javascript
{
  "name": "Tour Vịnh Hạ Long",
  "destination_id": "dest-uuid-123",    // Auto-populate destination name
  "location_id": "loc-uuid-456",        // Auto-populate location name
  // Other tour fields...
}
```
**Result:** System automatically sets `destination` and `location` names from database.

### 2️⃣ **Traditional Text Approach**
```javascript
{
  "name": "Tour Sapa",
  "destination": "Thị trấn Sapa",       // Direct text input
  "location": "Lào Cai",               // Direct text input
  // Other tour fields...
}
```
**Result:** Uses provided text directly without validation.

---

## 🛠️ New API Endpoints

### **Get Data for Dropdowns**

#### 1. Get All Destinations
```http
GET /api/destination-location/destinations
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dest-uuid-123",
      "name": "Vịnh Hạ Long",
      "location_id": "loc-uuid-456",
      "image": "halong.jpg",
      "location": {
        "id": "loc-uuid-456",
        "name": "Quảng Ninh",
        "description": "Tỉnh Quảng Ninh"
      }
    }
  ],
  "total": 50
}
```

#### 2. Get All Locations
```http
GET /api/destination-location/locations
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "loc-uuid-456",
      "name": "Quảng Ninh",
      "description": "Tỉnh Quảng Ninh",
      "image_url": "quangninh.jpg"
    }
  ],
  "total": 63
}
```

#### 3. Search Destinations
```http
GET /api/destination-location/destinations/search?q=hạ long
```

#### 4. Search Locations
```http
GET /api/destination-location/locations/search?q=sapa
```

---

## 🏗️ Tour Creation & Update

### **Create Tour with IDs (Enhanced)**
```http
POST /api/tours
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (ID-based):**
```json
{
  "name": "Tour Vịnh Hạ Long Premium",
  "description": "Khám phá Vịnh Hạ Long với du thuyền 5 sao",
  "destination_id": "dest-uuid-123",      // ← Auto-populate destination name
  "location_id": "loc-uuid-456",          // ← Auto-populate location name
  "departure_location": "Hà Nội",
  "price": 2800000,
  "tour_type": "Trong nước",
  "max_participants": 25,
  "min_participants": 2,
  "images": [
    { "image_url": "https://example.com/halong.jpg", "is_main": true }
  ],
  "departureDates": [
    {
      "departure_date": "2025-09-01",
      "end_date": "2025-09-03", 
      "number_of_days": 3,
      "number_of_nights": 2
    }
  ],
  "category_ids": [1, 2],
  "hotel_ids": [1, 2],
  "included_service_ids": [1, 2, 3]
}
```

**Request Body (Traditional):**
```json
{
  "name": "Tour Sapa",
  "description": "Chinh phục đỉnh Fansipan",
  "destination": "Thị trấn Sapa",         // ← Direct text
  "location": "Lào Cai",                  // ← Direct text
  "departure_location": "Hà Nội",
  "price": 1800000,
  // ... other fields
}
```

**Response:**
```json
{
  "id": "tour-uuid",
  "name": "Tour Vịnh Hạ Long Premium",
  "destination": "Vịnh Hạ Long",          // ← Auto-populated from destination_id
  "location": "Quảng Ninh",               // ← Auto-populated from location_id
  "status": "Chờ duyệt",                  // Agency tours need approval
  "agency_id": "agency-uuid",
  // ... other fields
}
```

### **Update Tour with IDs**
```http
PUT /api/tours/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Tour Updated Name",
  "destination_id": "new-dest-uuid",      // ← Will update destination name
  "location_id": "new-loc-uuid",          // ← Will update location name
  "price": 3000000
}
```

---

## 🔄 System Logic

### **Auto-Population Process:**

#### **Create Tour:**
1. **Extract IDs:** `destination_id` and `location_id` from request
2. **Validate IDs:** Check if IDs exist in database
3. **Auto-populate:** Set `destination` and `location` names from database
4. **Create tour:** With populated names
5. **Return:** Tour with auto-populated names

#### **Update Tour:**
1. **Extract IDs:** `destination_id` and `location_id` from request
2. **Validate IDs:** Check if IDs exist in database
3. **Auto-populate:** Update `destination` and `location` names
4. **Update tour:** With new populated names
5. **Return:** Updated tour

### **Error Handling:**
```json
// If destination_id doesn't exist
{
  "message": "Destination ID không tồn tại",
  "destination_id": "invalid-uuid"
}

// If location_id doesn't exist  
{
  "message": "Location ID không tồn tại",
  "location_id": "invalid-uuid"
}
```

---

## 🎯 Frontend Integration

### **Step 1: Load Dropdown Data**
```javascript
// Load destinations for dropdown
const destinations = await fetch('/api/destination-location/destinations');

// Load locations for dropdown
const locations = await fetch('/api/destination-location/locations');
```

### **Step 2: Create Tour Form**
```html
<!-- Destination Dropdown -->
<select name="destination_id">
  <option value="">Chọn điểm đến...</option>
  <option value="dest-uuid-123">Vịnh Hạ Long</option>
  <option value="dest-uuid-456">Thị trấn Sapa</option>
</select>

<!-- Location Dropdown -->
<select name="location_id">
  <option value="">Chọn địa điểm...</option>
  <option value="loc-uuid-123">Quảng Ninh</option>
  <option value="loc-uuid-456">Lào Cai</option>
</select>

<!-- OR Traditional Text Inputs -->
<input name="destination" placeholder="Nhập tên điểm đến..." />
<input name="location" placeholder="Nhập tên địa điểm..." />
```

### **Step 3: Submit Tour**
```javascript
const tourData = {
  name: "Tour Name",
  destination_id: formData.destination_id,  // From dropdown
  location_id: formData.location_id,        // From dropdown
  // OR
  destination: formData.destination,        // From text input
  location: formData.location,              // From text input
  // ... other fields
};

await fetch('/api/tours', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(tourData)
});
```

---

## 📊 Benefits

### **✅ ID-Based Approach:**
- **Consistency:** Standardized naming across all tours
- **Validation:** Automatic validation that destination/location exists
- **Referential Integrity:** Database relationships maintained
- **Easy Dropdowns:** Frontend can easily populate select options
- **Future-Proof:** Can add more destination/location metadata later

### **✅ Traditional Approach:**
- **Flexibility:** Can input any custom destination/location name
- **Backward Compatibility:** Works with existing data
- **Quick Input:** No need to find IDs, just type directly

---

## 🧪 Testing

Run comprehensive tests:
```bash
node test_destination_location_tour.js
```

**Test Coverage:**
1. ✅ Load all destinations
2. ✅ Load all locations  
3. ✅ Search destinations
4. ✅ Search locations
5. ✅ Create tour with IDs (auto-populate)
6. ✅ Create tour with text (traditional)
7. ✅ Update tour with new IDs
8. ✅ Error handling for invalid IDs

---

## 🎯 Summary

| Feature | ID-Based | Traditional |
|---------|----------|-------------|
| **Validation** | ✅ Auto-validated | ❌ No validation |
| **Consistency** | ✅ Standardized | ⚠️ Variable |
| **Flexibility** | ⚠️ Limited to DB | ✅ Any text |
| **Frontend UX** | ✅ Dropdowns | ✅ Text inputs |
| **Database Relations** | ✅ Maintained | ❌ No relations |

**🚀 System supports both approaches - use ID-based for new tours, traditional for backward compatibility!**

---

## 📋 Implementation Files

- **Controller:** `controllers/destinationLocationController.js`
- **Routes:** `routes/destinationLocationRoutes.js`
- **Enhanced Tour Controller:** `controllers/tourController.js` (updated)
- **App Routes:** `app.js` (updated)
- **Tests:** `test_destination_location_tour.js`
- **Documentation:** `docs/DESTINATION_LOCATION_TOUR_SYSTEM.md`

**✅ Complete system ready for production use!**
