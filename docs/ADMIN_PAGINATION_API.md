# 📄 **API PHÂN TRANG CHO ADMIN & AGENCY - TOUR MANAGEMENT**

## 📋 **TỔNG QUAN**

Hệ thống đã được cập nhật để hỗ trợ phân trang (pagination) cho tất cả các API liên quan đến quản lý tour, giúp tối ưu hiệu suất và trải nghiệm người dùng khi làm việc với danh sách tour lớn.

---

## 🔧 **ADMIN TOUR MANAGEMENT APIs**

### **1. Lấy danh sách tours (Admin) - Có phân trang**

**Endpoint:** `GET /api/admin/tours`  
**Authentication:** Required (Admin only)  
**Method:** GET

#### **Query Parameters:**
```javascript
{
  // Pagination
  page: 1,           // Trang hiện tại (default: 1)
  limit: 10,         // Số items per page (default: 10)
  
  // Filters
  status: "Chờ duyệt",          // Filter theo trạng thái
  agency_id: "uuid",            // Filter theo agency
  search: "Đà Lạt",             // Tìm kiếm trong name, location, destination  
  tour_type: "Trong nước",      // Filter theo loại tour
  created_from: "2025-01-01",   // Filter từ ngày tạo
  created_to: "2025-12-31"      // Filter đến ngày tạo
}
```

#### **Response Format:**
```json
{
  "success": true,
  "data": {
    "tours": [
      {
        "id": "uuid",
        "name": "Tour Đà Lạt 3N2Đ",
        "location": "Đà Lạt",
        "destination": "Thác Datanla",
        "price": 2900000,
        "status": "Chờ duyệt",
        "tour_type": "Trong nước",
        "created_at": "2025-07-20T10:00:00Z",
        "agency": {
          "id": "uuid",
          "agency_name": "Du lịch ABC",
          "status": "approved",
          "user": {
            "email": "agency@example.com",
            "full_name": "Nguyen Van A"
          }
        },
        "departureDates": [...],
        "images": [...],
        "promotion": {...}
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "status": "Chờ duyệt",
      "search": null,
      "agency_id": null
    }
  }
}
```

### **2. Thống kê tours (Admin)**

**Endpoint:** `GET /api/admin/tours/stats`  
**Authentication:** Required (Admin only)

#### **Response:**
```json
{
  "success": true,
  "data": {
    "statusStats": [
      { "status": "Chờ duyệt", "count": 15 },
      { "status": "Đang hoạt động", "count": 23 },
      { "status": "Ngừng hoạt động", "count": 5 },
      { "status": "Đã hủy", "count": 2 }
    ],
    "typeStats": [
      { "type": "Trong nước", "count": 35 },
      { "type": "Quốc tế", "count": 10 }
    ],
    "recentTours": 8,
    "pendingCount": 15,
    "timestamp": "2025-07-20T15:30:00Z"
  }
}
```

### **3. Duyệt tour (Admin)**

**Endpoint:** `PATCH /api/admin/tours/:id/approve`  
**Authentication:** Required (Admin only)

#### **Request Body:**
```json
{
  "reason": "Tour thông tin đầy đủ và chất lượng tốt"
}
```

#### **Response:**
```json
{
  "success": true,
  "message": "Tour 'Du lịch Đà Lạt' đã được duyệt thành công",
  "data": {
    "id": "uuid",
    "name": "Du lịch Đà Lạt",
    "oldStatus": "Chờ duyệt",
    "newStatus": "Đang hoạt động",
    "reason": "Tour thông tin đầy đủ và chất lượng tốt",
    "approvedAt": "2025-07-20T15:30:00Z",
    "approvedBy": "admin@example.com"
  }
}
```

### **4. Từ chối tour (Admin)**

**Endpoint:** `PATCH /api/admin/tours/:id/reject`  
**Authentication:** Required (Admin only)

#### **Request Body:**
```json
{
  "reason": "Thông tin tour không đầy đủ, thiếu hình ảnh"
}
```

### **5. Cập nhật trạng thái tour (Admin)**

**Endpoint:** `PATCH /api/admin/tours/:id/status`  
**Authentication:** Required (Admin only)

#### **Request Body:**
```json
{
  "status": "Ngừng hoạt động",
  "reason": "Vi phạm quy định về an toàn"
}
```

### **6. Xóa tour (Admin)**

**Endpoint:** `DELETE /api/admin/tours/:id`  
**Authentication:** Required (Admin only)  
**Query:** `?force=true` (optional - force delete)

### **7. Bulk cập nhật trạng thái (Admin)**

**Endpoint:** `PATCH /api/admin/tours/bulk/status`  
**Authentication:** Required (Admin only)

#### **Request Body:**
```json
{
  "tour_ids": ["uuid1", "uuid2", "uuid3"],
  "status": "Ngừng hoạt động",
  "reason": "Bảo trì hệ thống"
}
```

---

## 🏢 **AGENCY TOUR MANAGEMENT APIs**

### **1. Lấy tours của agency (có phân trang)**

**Endpoint:** `GET /api/tours/my-agency`  
**Authentication:** Required (Agency only)

#### **Query Parameters:**
```javascript
{
  // Pagination
  page: 1,           // Trang hiện tại (default: 1)
  limit: 10,         // Số items per page (default: 10)
  
  // Filters
  status: "Chờ duyệt",          // Filter theo trạng thái
  search: "Đà Lạt"              // Tìm kiếm trong name, location, destination
}
```

#### **Response Format:**
```json
{
  "tours": [
    {
      "id": "uuid",
      "name": "Tour Đà Lạt 3N2Đ",
      "location": "Đà Lạt",
      "destination": "Thác Datanla",
      "price": 2900000,
      "status": "Chờ duyệt",
      "departureDates": [...],
      "images": [...],
      "promotion": {...}
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "status": "Chờ duyệt",
    "search": null
  }
}
```

### **2. Lấy tất cả tours (Public/Admin/Agency)**

**Endpoint:** `GET /api/tours`  
**Authentication:** Optional

#### **Query Parameters:**
```javascript
{
  // Pagination
  page: 1,
  limit: 10,
  
  // Filters (similar to admin)
  status: "Đang hoạt động",
  search: "Đà Lạt",
  agency_id: "uuid"  // Admin only
}
```

---

## 🎯 **FRONTEND INTEGRATION GUIDE**

### **React/Vue.js Example - Admin Tours Management:**

```javascript
// API Service
const tourService = {
  // Admin - Get tours with pagination
  async getAdminTours(params = {}) {
    const queryString = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...params.filters
    }).toString();
    
    const response = await fetch(`/api/admin/tours?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    return response.json();
  },
  
  // Admin - Get tour statistics
  async getTourStats() {
    const response = await fetch('/api/admin/tours/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    return response.json();
  },
  
  // Admin - Approve tour
  async approveTour(tourId, reason) {
    const response = await fetch(`/api/admin/tours/${tourId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ reason })
    });
    return response.json();
  },
  
  // Admin - Reject tour
  async rejectTour(tourId, reason) {
    const response = await fetch(`/api/admin/tours/${tourId}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ reason })
    });
    return response.json();
  }
};

// React Component Example
const AdminToursPage = () => {
  const [tours, setTours] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(false);
  
  const loadTours = async () => {
    setLoading(true);
    try {
      const result = await tourService.getAdminTours({ 
        page: filters.page,
        limit: filters.limit,
        filters: {
          status: filters.status,
          search: filters.search
        }
      });
      
      if (result.success) {
        setTours(result.data.tours);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Error loading tours:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadTours();
  }, [filters]);
  
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };
  
  const handleApproveTour = async (tourId) => {
    const reason = prompt('Nhập lý do duyệt:');
    if (reason) {
      try {
        const result = await tourService.approveTour(tourId, reason);
        if (result.success) {
          alert('Duyệt tour thành công!');
          loadTours(); // Reload tours
        }
      } catch (error) {
        alert('Lỗi khi duyệt tour');
      }
    }
  };
  
  return (
    <div>
      {/* Filters */}
      <div className="filters">
        <select 
          value={filters.status} 
          onChange={(e) => handleFilterChange({ status: e.target.value })}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Chờ duyệt">Chờ duyệt</option>
          <option value="Đang hoạt động">Đang hoạt động</option>
          <option value="Ngừng hoạt động">Ngừng hoạt động</option>
          <option value="Đã hủy">Đã hủy</option>
        </select>
        
        <input
          type="text"
          placeholder="Tìm kiếm tour..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
      </div>
      
      {/* Tours Table */}
      <table>
        <thead>
          <tr>
            <th>Tên tour</th>
            <th>Agency</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {tours.map(tour => (
            <tr key={tour.id}>
              <td>{tour.name}</td>
              <td>{tour.agency?.agency_name}</td>
              <td>{tour.status}</td>
              <td>{new Date(tour.created_at).toLocaleDateString('vi-VN')}</td>
              <td>
                {tour.status === 'Chờ duyệt' && (
                  <>
                    <button onClick={() => handleApproveTour(tour.id)}>
                      Duyệt
                    </button>
                    <button onClick={() => handleRejectTour(tour.id)}>
                      Từ chối
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Pagination */}
      <div className="pagination">
        <button 
          disabled={!pagination.hasPrev}
          onClick={() => handlePageChange(pagination.page - 1)}
        >
          Previous
        </button>
        
        <span>
          Trang {pagination.page} / {pagination.totalPages} 
          (Tổng: {pagination.total} tours)
        </span>
        
        <button 
          disabled={!pagination.hasNext}
          onClick={() => handlePageChange(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};
```

### **Agency Tours Management Example:**

```javascript
// Agency component (similar structure)
const AgencyToursPage = () => {
  const [tours, setTours] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 10
  });
  
  const loadTours = async () => {
    const queryString = new URLSearchParams({
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
      search: filters.search
    }).toString();
    
    const response = await fetch(`/api/tours/my-agency?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('agencyToken')}`
      }
    });
    
    const result = await response.json();
    setTours(result.tours);
    setPagination(result.pagination);
  };
  
  // Similar structure as admin component...
};
```

---

## 🧪 **TESTING EXAMPLES**

### **1. Test Admin Tours với Pagination:**

```bash
# Lấy trang đầu tiên với 5 tours per page
curl -H "Authorization: Bearer <admin_token>" \
  "http://localhost:5001/api/admin/tours?page=1&limit=5"

# Filter tours cần duyệt
curl -H "Authorization: Bearer <admin_token>" \
  "http://localhost:5001/api/admin/tours?status=Chờ duyệt&page=1&limit=10"

# Tìm kiếm tours
curl -H "Authorization: Bearer <admin_token>" \
  "http://localhost:5001/api/admin/tours?search=Đà Lạt&page=1&limit=10"

# Thống kê tours
curl -H "Authorization: Bearer <admin_token>" \
  "http://localhost:5001/api/admin/tours/stats"
```

### **2. Test Agency Tours với Pagination:**

```bash
# Lấy tours của agency với pagination
curl -H "Authorization: Bearer <agency_token>" \
  "http://localhost:5001/api/tours/my-agency?page=1&limit=10"

# Filter tours theo trạng thái
curl -H "Authorization: Bearer <agency_token>" \
  "http://localhost:5001/api/tours/my-agency?status=Chờ duyệt&page=1&limit=5"
```

### **3. Test Admin Actions:**

```bash
# Duyệt tour
curl -X PATCH \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Tour chất lượng tốt"}' \
  "http://localhost:5001/api/admin/tours/uuid/approve"

# Từ chối tour
curl -X PATCH \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Thiếu thông tin chi tiết"}' \
  "http://localhost:5001/api/admin/tours/uuid/reject"
```

---

## 📊 **PERFORMANCE OPTIMIZATIONS**

### **Database Indexing:**
```sql
-- Tối ưu queries cho pagination
CREATE INDEX idx_tours_created_at ON tours(created_at DESC);
CREATE INDEX idx_tours_status ON tours(status);
CREATE INDEX idx_tours_agency_id ON tours(agency_id);
CREATE INDEX idx_tours_search ON tours USING gin(to_tsvector('vietnamese', name || ' ' || location || ' ' || destination));
```

### **Caching Strategy:**
```javascript
// Cache tour stats for admin dashboard
const cacheKey = 'admin:tour:stats';
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}
// ... calculate stats
await redis.setex(cacheKey, 300, JSON.stringify(stats)); // Cache 5 minutes
```

---

## 🚨 **IMPORTANT NOTES**

1. **Default Limits:** 
   - Default `limit`: 10 items
   - Maximum `limit`: 100 items
   - Default `page`: 1

2. **Filter Validation:**
   - `status` phải là một trong các giá trị hợp lệ
   - `search` hỗ trợ tìm kiếm không phân biệt hoa thường
   - `date` filters phải đúng format ISO

3. **Performance:**
   - Sử dụng pagination để tránh load quá nhiều data
   - Implement caching cho stats và filters phổ biến
   - Optimize database indexes

4. **Security:**
   - Admin có quyền xem tất cả tours
   - Agency chỉ xem tours của mình
   - Validate permissions và authentication

5. **Error Handling:**
   - Consistent error response format
   - Proper HTTP status codes
   - Detailed error messages for debugging

---

## 🔄 **MIGRATION GUIDE**

### **Frontend Changes Required:**

1. **Update API calls** to handle new response format with pagination
2. **Add pagination controls** (Previous/Next buttons, page numbers)
3. **Implement filtering UI** (dropdowns, search inputs)
4. **Handle loading states** during pagination
5. **Update state management** to store pagination info

### **Backend Compatibility:**

- ✅ **Backward compatible**: Old API calls still work
- ✅ **Optional parameters**: Pagination params have defaults
- ✅ **Progressive enhancement**: Can implement pagination gradually

Hệ thống phân trang đã sẵn sàng cho production với đầy đủ tính năng admin management và agency management! 🚀
