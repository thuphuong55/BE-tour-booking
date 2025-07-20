# 🧪 **TEST SCRIPT - API PHÂN TRANG ADMIN & AGENCY**

## 📋 **SETUP TESTING**

### **1. Start Server**
```bash
cd "d:\DOAN\LVTN\BE-LVTN\BE-tour-booking"
$env:PORT=5005; node server.js
```

### **2. Test Commands (PowerShell)**

## 🌍 **PUBLIC ENDPOINTS TESTS**

### **Test 1: Public Tours với Pagination**
```powershell
# Test pagination cơ bản
Invoke-WebRequest -Uri "http://localhost:5005/api/tours?page=1&limit=3" -Method GET | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Test pagination trang 2
Invoke-WebRequest -Uri "http://localhost:5005/api/tours?page=2&limit=5" -Method GET | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Test với search
Invoke-WebRequest -Uri "http://localhost:5005/api/tours?page=1&limit=3&search=Đà Nẵng" -Method GET | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Test filter by status
Invoke-WebRequest -Uri "http://localhost:5005/api/tours?page=1&limit=5&status=Đang hoạt động" -Method GET | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

## 🏢 **AGENCY ENDPOINTS TESTS**

### **Test 2: Agency Tours với Pagination (cần token)**
```powershell
# Get agency token first (replace with actual credentials)
$agencyCredentials = @{
    email = "agency12@gmail.com"
    password = "123456789"
} | ConvertTo-Json

$agencyLoginResponse = Invoke-WebRequest -Uri "http://localhost:5005/api/auth/login" -Method POST -Body $agencyCredentials -ContentType "application/json" | ConvertFrom-Json
$agencyToken = $agencyLoginResponse.token

Write-Host "Agency Token: $agencyToken"

# Test agency tours pagination
$headers = @{Authorization = "Bearer $agencyToken"}
Invoke-WebRequest -Uri "http://localhost:5005/api/tours/my-agency?page=1&limit=2" -Method GET -Headers $headers | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Test agency tours with filters
Invoke-WebRequest -Uri "http://localhost:5005/api/tours/my-agency?page=1&limit=5&status=Đang hoạt động" -Method GET -Headers $headers | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Test agency tours search
Invoke-WebRequest -Uri "http://localhost:5005/api/tours/my-agency?page=1&limit=3&search=Đà Nẵng" -Method GET -Headers $headers | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

## 👨‍💼 **ADMIN ENDPOINTS TESTS**

### **Test 3: Admin Tours Management (cần admin token)**
```powershell
# Get admin token first (replace with actual credentials)
$adminCredentials = @{
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

$adminLoginResponse = Invoke-WebRequest -Uri "http://localhost:5005/api/auth/login" -Method POST -Body $adminCredentials -ContentType "application/json" | ConvertFrom-Json
$adminToken = $adminLoginResponse.token

Write-Host "Admin Token: $adminToken"

# Test admin tours pagination
$adminHeaders = @{Authorization = "Bearer $adminToken"}
Invoke-WebRequest -Uri "http://localhost:5005/api/admin/tours?page=1&limit=5" -Method GET -Headers $adminHeaders | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Test admin tours with filters
Invoke-WebRequest -Uri "http://localhost:5005/api/admin/tours?page=1&limit=3&status=Chờ duyệt" -Method GET -Headers $adminHeaders | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Test admin tours search
Invoke-WebRequest -Uri "http://localhost:5005/api/admin/tours?page=1&limit=5&search=Đà Lạt" -Method GET -Headers $adminHeaders | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Test admin tours by agency
Invoke-WebRequest -Uri "http://localhost:5005/api/admin/tours?page=1&limit=5&agency_id=d3a463c7-fa0f-486c-8b89-8429c5640186" -Method GET -Headers $adminHeaders | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Test admin tour statistics
Invoke-WebRequest -Uri "http://localhost:5005/api/admin/tours/stats" -Method GET -Headers $adminHeaders | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### **Test 4: Admin Tour Actions**
```powershell
# Approve a tour (replace with actual tour ID)
$tourId = "your-tour-id-here"
$approveData = @{reason = "Tour chất lượng tốt, thông tin đầy đủ"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5005/api/admin/tours/$tourId/approve" -Method PATCH -Body $approveData -ContentType "application/json" -Headers $adminHeaders | Select-Object -ExpandProperty Content

# Reject a tour (replace with actual tour ID)
$rejectData = @{reason = "Thiếu thông tin chi tiết, cần bổ sung hình ảnh"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5005/api/admin/tours/$tourId/reject" -Method PATCH -Body $rejectData -ContentType "application/json" -Headers $adminHeaders | Select-Object -ExpandProperty Content

# Update tour status (replace with actual tour ID)
$statusData = @{
    status = "Ngừng hoạt động"
    reason = "Tạm ngừng để bảo trì"
} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5005/api/admin/tours/$tourId/status" -Method PATCH -Body $statusData -ContentType "application/json" -Headers $adminHeaders | Select-Object -ExpandProperty Content

# Bulk update status
$bulkData = @{
    tour_ids = @("tour-id-1", "tour-id-2")
    status = "Ngừng hoạt động"
    reason = "Bảo trì hệ thống"
} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5005/api/admin/tours/bulk/status" -Method PATCH -Body $bulkData -ContentType "application/json" -Headers $adminHeaders | Select-Object -ExpandProperty Content
```

## 📊 **PERFORMANCE TESTS**

### **Test 5: Large Pagination**
```powershell
# Test larger limits
Invoke-WebRequest -Uri "http://localhost:5005/api/tours?page=1&limit=20" -Method GET | Select-Object -ExpandProperty Content | ConvertFrom-Json | Select-Object pagination

# Test edge cases
Invoke-WebRequest -Uri "http://localhost:5005/api/tours?page=999&limit=10" -Method GET | Select-Object -ExpandProperty Content | ConvertFrom-Json | Select-Object pagination

# Test maximum limit
Invoke-WebRequest -Uri "http://localhost:5005/api/tours?page=1&limit=100" -Method GET | Select-Object -ExpandProperty Content | ConvertFrom-Json | Select-Object pagination
```

## 🎯 **FRONTEND INTEGRATION EXAMPLES**

### **JavaScript/Fetch Examples**
```javascript
// 1. Public Tours Pagination
async function loadPublicTours(page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams({
        page,
        limit,
        ...filters
    });
    
    const response = await fetch(`http://localhost:5005/api/tours?${params}`);
    const data = await response.json();
    return data;
}

// Example usage:
// loadPublicTours(1, 10, { search: 'Đà Lạt', status: 'Đang hoạt động' })

// 2. Agency Tours Pagination
async function loadAgencyTours(token, page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams({
        page,
        limit,
        ...filters
    });
    
    const response = await fetch(`http://localhost:5005/api/tours/my-agency?${params}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    return data;
}

// 3. Admin Tours Management
async function loadAdminTours(token, page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams({
        page,
        limit,
        ...filters
    });
    
    const response = await fetch(`http://localhost:5005/api/admin/tours?${params}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    return data.success ? data.data : null;
}

// 4. Admin Tour Actions
async function approveTour(token, tourId, reason) {
    const response = await fetch(`http://localhost:5005/api/admin/tours/${tourId}/approve`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
    });
    return await response.json();
}

async function rejectTour(token, tourId, reason) {
    const response = await fetch(`http://localhost:5005/api/admin/tours/${tourId}/reject`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
    });
    return await response.json();
}

// 5. Tour Statistics
async function getTourStats(token) {
    const response = await fetch(`http://localhost:5005/api/admin/tours/stats`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    return data.success ? data.data : null;
}
```

### **React Component Example**
```jsx
import React, { useState, useEffect } from 'react';

const AdminToursTable = ({ adminToken }) => {
    const [tours, setTours] = useState([]);
    const [pagination, setPagination] = useState({});
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        status: '',
        search: ''
    });
    const [loading, setLoading] = useState(false);
    
    const loadTours = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(filters);
            const response = await fetch(`/api/admin/tours?${params}`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const result = await response.json();
            
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
                const response = await fetch(`/api/admin/tours/${tourId}/approve`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ reason })
                });
                const result = await response.json();
                if (result.success) {
                    alert('Duyệt tour thành công!');
                    loadTours();
                }
            } catch (error) {
                alert('Lỗi khi duyệt tour');
            }
        }
    };
    
    return (
        <div>
            {/* Filters */}
            <div style={{ marginBottom: '20px' }}>
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
                    style={{ marginLeft: '10px' }}
                />
            </div>
            
            {/* Loading */}
            {loading && <div>Đang tải...</div>}
            
            {/* Tours Table */}
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Tên tour</th>
                        <th>Agency</th>
                        <th>Trạng thái</th>
                        <th>Giá</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {tours.map(tour => (
                        <tr key={tour.id}>
                            <td>{tour.name}</td>
                            <td>{tour.agency?.name}</td>
                            <td>{tour.status}</td>
                            <td>{tour.price?.toLocaleString('vi-VN')} VND</td>
                            <td>{new Date(tour.created_at).toLocaleDateString('vi-VN')}</td>
                            <td>
                                {tour.status === 'Chờ duyệt' && (
                                    <button onClick={() => handleApproveTour(tour.id)}>
                                        Duyệt
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* Pagination */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button 
                    disabled={!pagination.hasPrev}
                    onClick={() => handlePageChange(pagination.page - 1)}
                >
                    « Previous
                </button>
                
                <span style={{ margin: '0 20px' }}>
                    Trang {pagination.page} / {pagination.totalPages} 
                    (Tổng: {pagination.total} tours)
                </span>
                
                <button 
                    disabled={!pagination.hasNext}
                    onClick={() => handlePageChange(pagination.page + 1)}
                >
                    Next »
                </button>
            </div>
        </div>
    );
};

export default AdminToursTable;
```

## ✅ **EXPECTED RESULTS**

### **1. Public Tours API Response:**
```json
{
  "tours": [...],
  "pagination": {
    "page": 1,
    "limit": 3,
    "total": 67,
    "totalPages": 23,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **2. Agency Tours API Response:**
```json
{
  "tours": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "status": "",
    "search": ""
  }
}
```

### **3. Admin Tours API Response:**
```json
{
  "success": true,
  "data": {
    "tours": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 67,
      "totalPages": 7,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "status": null,
      "agency_id": null,
      "search": null
    }
  }
}
```

### **4. Admin Tour Stats Response:**
```json
{
  "success": true,
  "data": {
    "statusStats": [
      { "status": "Chờ duyệt", "count": 15 },
      { "status": "Đang hoạt động", "count": 40 },
      { "status": "Ngừng hoạt động", "count": 8 },
      { "status": "Đã hủy", "count": 4 }
    ],
    "typeStats": [
      { "type": "Trong nước", "count": 55 },
      { "type": "Quốc tế", "count": 12 }
    ],
    "recentTours": 8,
    "pendingCount": 15,
    "timestamp": "2025-07-20T15:30:00Z"
  }
}
```

## 🚀 **DEPLOYMENT CHECKLIST**

- [x] ✅ **Backend APIs**: Admin tours, Agency tours, Public tours với pagination
- [x] ✅ **Authentication**: JWT token cho admin/agency
- [x] ✅ **Filtering**: Status, search, agency_id, tour_type, date range
- [x] ✅ **Error Handling**: Consistent error responses
- [x] ✅ **Performance**: Pagination để optimize queries
- [x] ✅ **Documentation**: Complete API docs với examples

Hệ thống phân trang đã sẵn sàng cho production! 🎉
