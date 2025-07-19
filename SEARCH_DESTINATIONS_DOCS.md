# 🔍 SEARCH SYSTEM - LOCATIONS & DESTINATIONS

## 📋 OVERVIEW
Đã thêm thành công hệ thống search cho cả **Locations** và **Destinations** với khả năng tìm kiếm tours liên quan.

---

## 🚀 NEW ENDPOINTS ADDED

### 1. **GET /api/search/top** (Existing - Enhanced)
**Top Locations với Tours liên quan**
```
URL: http://localhost:5000/api/search/top
Method: GET
Description: Trả về top 5 locations dựa trên search logs + tours liên quan
```

**Response Structure:**
```javascript
{
  "locations": [
    {
      "id": "location-uuid",
      "name": "Phú Quốc", 
      "image_url": "https://...",
      "description": "Description...",
      "tours": [
        {
          "id": "tour-uuid",
          "name": "Tour khám phá Phú Quốc 3n2d",
          "price": 3500000,
          "images": [...],
          "departureDates": [...],
          "promotion": {...}
        }
      ]
    }
  ]
}
```

### 2. **GET /api/search/top-destinations** (NEW)
**Top Destinations với Tours liên quan**
```
URL: http://localhost:5000/api/search/top-destinations  
Method: GET
Description: Trả về top 5 destinations dựa trên search logs + tours liên quan
```

**Response Structure:**
```javascript
{
  "destinations": [
    {
      "id": "destination-uuid",
      "name": "Chợ Đà Lạt",
      "image": null,
      "location": {
        "id": "location-uuid", 
        "name": "Đà Lạt",
        "image_url": "https://...",
        "description": "Description..."
      },
      "tours": [
        {
          "id": "tour-uuid",
          "name": "Tour khám phá Đà Lạt 3N2Đ",
          "price": 32000000,
          "images": [...],
          "departureDates": [...],
          "promotion": {...}
        }
      ]
    }
  ]
}
```

---

## 📊 CURRENT TEST RESULTS

### **Locations Endpoint Results:**
```
1. Phú Quốc - 2 tours
2. Đà Lạt - 3 tours  
3. Đà Nẵng - 0 tours
Total: 3 locations, 5 tours
```

### **Destinations Endpoint Results:**
```
1. Chợ Đà Lạt (Đà Lạt) - 1 tour
2. Trung tâm Đà Lạt (Đà Lạt) - 0 tours
3. Thành phố Đà Nẵng (Đà Nẵng) - 0 tours  
Total: 3 destinations, 1 tour
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### **Search Logic:**
```javascript
// Cả hai endpoint sử dụng cùng logic:
1. Query top 5 keywords từ search_logs table
2. Find locations/destinations matching keywords 
3. For each location/destination:
   - Search tours có location/destination fields chứa tên
   - Include tour images, departure dates, promotions
   - Limit 3 tours per location/destination
4. Return combined data
```

### **Database Relations:**
```javascript
// Location → Destination (1:N)
Location.hasMany(Destination, { foreignKey: "location_id" })
Destination.belongsTo(Location, { foreignKey: "location_id" })

// Tour search by text matching:
Tour.location LIKE '%keyword%' OR Tour.destination LIKE '%keyword%'
```

---

## 📝 SEARCH ROUTES SUMMARY

```javascript
// Search Routes (/api/search)
POST /log                    // Ghi log tìm kiếm của user
GET  /top                    // Top locations + tours
GET  /top-destinations       // Top destinations + tours (NEW)
```

---

## ✅ FEATURES IMPLEMENTED

- **✅ Location-based search với tours**
- **✅ Destination-based search với tours** (NEW)
- **✅ Search logging system**
- **✅ Top keywords aggregation**  
- **✅ Tour data inclusion (images, dates, promotions)**
- **✅ Case-insensitive text matching**
- **✅ Limit tours per location/destination (3 max)**

---

## 🎯 USAGE FOR FRONTEND

### **Homepage Popular Locations:**
```javascript
fetch('/api/search/top')
  .then(res => res.json())
  .then(data => {
    // Display data.locations with tours
    data.locations.forEach(location => {
      console.log(location.name, location.tours.length + ' tours');
    });
  });
```

### **Homepage Popular Destinations:**
```javascript  
fetch('/api/search/top-destinations')
  .then(res => res.json())
  .then(data => {
    // Display data.destinations with tours
    data.destinations.forEach(destination => {
      console.log(destination.name, destination.tours.length + ' tours');
    });
  });
```

---

## 📈 NEXT STEPS

1. **Add more search logs** để có dữ liệu thực tế
2. **Enhance destination images** (hiện tại null)
3. **Add caching** cho performance 
4. **Implement pagination** nếu data lớn
5. **Add search by categories, tour types**

**✅ Search system is complete and ready for frontend integration!**
