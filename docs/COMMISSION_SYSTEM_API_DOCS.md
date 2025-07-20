# API HỆ THỐNG HOA HỒNG - Commission System

## 🎯 Mục đích
Hệ thống tính toán và quản lý hoa hồng cho Admin và Agency trên nền tảng đặt tour. Admin nhận hoa hồng từ mỗi booking thành công, Agency nhận phần còn lại.

## 💡 Công thức tính hoa hồng
```
Hoa hồng Admin = Tổng giá trị tour × Tỷ lệ % hoa hồng
Số tiền Agency = Tổng giá trị tour - Hoa hồng Admin
```

## 📊 Ví dụ thực tế
- **Booking**: Tour Đà Lạt = 2,000,000 VNĐ
- **Tỷ lệ hoa hồng**: 15%
- **Hoa hồng Admin**: 2,000,000 × 15% = 300,000 VNĐ
- **Agency nhận**: 2,000,000 - 300,000 = 1,700,000 VNĐ

---

## 📋 API Endpoints

### 1. Tính hoa hồng cho một booking
```http
POST /api/admin/commissions/calculate/:bookingId
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tính hoa hồng thành công",
  "data": {
    "booking_id": "booking-uuid",
    "total_price": 2000000,
    "commission_rate": 15.00,
    "admin_commission": 300000,
    "agency_amount": 1700000,
    "agency_name": "Công ty Du lịch ABC",
    "tour_name": "Tour Đà Lạt 3 ngày 2 đêm",
    "calculated_at": "2025-07-19T06:45:00.000Z"
  }
}
```

---

### 2. Tính hoa hồng cho tất cả booking chưa được tính
```http
POST /api/admin/commissions/calculate-pending
```

**Response:**
```json
{
  "success": true,
  "message": "Đã xử lý 15 booking",
  "results": {
    "success": 12,
    "failed": 3,
    "details": [...]
  }
}
```

---

### 3. Báo cáo hoa hồng
```http
GET /api/admin/commissions/report?date_from=2025-07-01&date_to=2025-07-19&agency_id=uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_bookings": 45,
      "total_revenue": 125000000,
      "total_admin_commission": 18750000,
      "total_agency_amount": 106250000
    },
    "by_agency": [
      {
        "agency_id": "uuid",
        "agency_name": "Du lịch ABC",
        "booking_count": 12,
        "total_revenue": 35000000,
        "admin_commission": 5250000,
        "agency_amount": 29750000
      }
    ],
    "bookings": [...]
  }
}
```

---

### 4. Quản lý cấu hình hoa hồng

#### Lấy danh sách cấu hình
```http
GET /api/admin/commissions/settings?agency_id=uuid&is_active=true
```

#### Tạo cấu hình hoa hồng mới
```http
POST /api/admin/commissions/settings
```

**Request Body:**
```json
{
  "user_id": "agency-user-uuid",
  "commission_rate": 18.50,
  "min_booking_value": 1000000,
  "max_booking_value": 10000000,
  "tour_category_id": "category-uuid",
  "effective_from": "2025-07-19T00:00:00.000Z",
  "effective_to": "2025-12-31T23:59:59.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo cấu hình hoa hồng thành công",
  "data": {
    "id": "setting-uuid",
    "user_id": "agency-user-uuid",
    "commission_rate": 18.50,
    "min_booking_value": 1000000,
    "max_booking_value": 10000000,
    "tour_category_id": "category-uuid",
    "effective_from": "2025-07-19T00:00:00.000Z",
    "effective_to": "2025-12-31T23:59:59.000Z",
    "is_active": true,
    "agency": {
      "id": "agency-user-uuid",
      "name": "Nguyễn Văn A",
      "email": "agency@example.com"
    },
    "tourCategory": {
      "id": "category-uuid",
      "name": "Tour Cao cấp"
    }
  }
}
```

#### Cập nhật cấu hình hoa hồng
```http
PUT /api/admin/commissions/settings/:id
```

#### Xóa cấu hình hoa hồng
```http
DELETE /api/admin/commissions/settings/:id
```

---

## 🗄️ Cấu trúc Database

### Bảng `booking` (đã thêm)
```sql
ALTER TABLE booking 
ADD COLUMN commission_rate DECIMAL(5,2) NULL COMMENT 'Tỷ lệ hoa hồng admin (%)',
ADD COLUMN admin_commission DECIMAL(12,2) NULL COMMENT 'Số tiền hoa hồng admin',
ADD COLUMN agency_amount DECIMAL(12,2) NULL COMMENT 'Số tiền agency nhận',
ADD COLUMN commission_calculated_at DATETIME NULL COMMENT 'Thời điểm tính hoa hồng';
```

### Bảng `commission_settings`
```sql
CREATE TABLE commission_settings (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  min_booking_value DECIMAL(12,2) NULL,
  max_booking_value DECIMAL(12,2) NULL,
  tour_category_id CHAR(36) NULL,
  effective_from DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_to DATETIME NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (tour_category_id) REFERENCES tour_category(id)
);
```

---

## ⚙️ Logic tính hoa hồng

### Quy tắc áp dụng tỷ lệ hoa hồng:
1. **Ưu tiên theo tour category**: Cấu hình có `tour_category_id` cụ thể sẽ được áp dụng trước
2. **Ưu tiên theo giá trị booking**: Cấu hình có `min_booking_value`/`max_booking_value` cụ thể
3. **Ưu tiên theo thời gian**: Cấu hình mới nhất sẽ được áp dụng
4. **Mặc định**: 15% nếu không tìm thấy cấu hình nào

### Điều kiện tính hoa hồng:
- Chỉ tính cho booking có `status = 'confirmed'`
- Không tính lại nếu đã có `commission_calculated_at` (trừ khi `force = true`)
- Tour phải có thông tin agency hợp lệ

---

## 📱 Use Cases

### 1. Tính hoa hồng tự động khi booking confirmed
```javascript
// Trong booking controller khi update status = 'confirmed'
if (booking.status === 'confirmed' && !booking.commission_calculated_at) {
  await CommissionService.calculateCommission(booking.id);
}
```

### 2. Báo cáo doanh thu hàng tháng cho Admin
```javascript
const report = await fetch('/api/admin/commissions/report?date_from=2025-07-01&date_to=2025-07-31');
```

### 3. Thiết lập hoa hồng đặc biệt cho agency VIP
```javascript
const vipCommissionSetting = {
  user_id: "vip-agency-user-id",
  commission_rate: 12.00, // Thấp hơn vì là VIP
  min_booking_value: 5000000, // Chỉ áp dụng cho booking lớn
  effective_from: "2025-08-01T00:00:00.000Z"
};
```

---

## 🔒 Bảo mật
- **Authentication**: Chỉ Admin được phép truy cập
- **Authorization**: Middleware `ensureAdmin` bắt buộc
- **Validation**: Kiểm tra tỷ lệ hoa hồng 0-100%
- **Audit Trail**: Lưu `commission_calculated_at` để theo dõi

---

## ✅ Lợi ích

1. **Tự động hóa**: Tính hoa hồng tự động khi booking confirmed
2. **Linh hoạt**: Cấu hình tỷ lệ khác nhau cho từng agency/category
3. **Minh bạch**: Báo cáo chi tiết cho cả Admin và Agency
4. **Theo dõi**: Audit trail đầy đủ cho mọi giao dịch
5. **Hiệu quả**: API tối ưu cho việc tính toán hàng loạt

---

---

## 📊 Dashboard API Endpoints

### 1. Admin Dashboard - Tổng quan hoa hồng
```http
GET /api/dashboard/commissions/admin/overview?period=month
```

**Parameters:**
- `period`: month | quarter | year

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_bookings": 156,
      "total_revenue": 312000000,
      "total_admin_commission": 46800000,
      "total_agency_amount": 265200000,
      "avg_commission_rate": 15.0
    },
    "top_agencies": [
      {
        "agency_id": "uuid",
        "agency_name": "Du lịch Việt",
        "booking_count": 45,
        "total_revenue": 95000000,
        "admin_commission": 14250000
      }
    ],
    "monthly_chart": [
      {
        "month": "2025-01",
        "admin_commission": 5200000,
        "booking_count": 24
      }
    ],
    "period": "month"
  }
}
```

---

### 2. Admin Dashboard - Bookings cần tính hoa hồng
```http
GET /api/dashboard/commissions/admin/pending?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pending_count": 5,
    "bookings": [
      {
        "id": "booking-uuid",
        "total_price": 2500000,
        "booking_date": "2025-07-18T10:30:00.000Z",
        "tour": {
          "id": "tour-uuid",
          "name": "Tour Hạ Long 2N1Đ",
          "location": "Quảng Ninh"
        },
        "agency": {
          "id": "agency-uuid",
          "name": "Du lịch ABC"
        },
        "days_since_booking": 1
      }
    ]
  }
}
```

---

### 3. Agency Dashboard - Thống kê hoa hồng
```http
GET /api/dashboard/commissions/agency/stats?period=month
```

**Headers:**
```
Authorization: Bearer <agency_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_bookings": 28,
      "total_revenue": 65000000,
      "admin_commission_paid": 9750000,
      "agency_earnings": 55250000,
      "avg_commission_rate": 15.0,
      "pending_withdrawal": 12500000
    },
    "current_commission_rate": 15.00,
    "top_tours": [
      {
        "tour_id": "tour-uuid",
        "tour_name": "Tour Phú Quốc 3N2Đ",
        "location": "Kiên Giang",
        "booking_count": 8,
        "agency_earnings": 18700000
      }
    ],
    "period": "month"
  }
}
```

---

### 4. Agency Dashboard - Lịch sử hoa hồng
```http
GET /api/dashboard/commissions/agency/history?page=1&limit=20&date_from=2025-07-01&date_to=2025-07-19
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "total_pages": 3,
    "commissions": [
      {
        "booking_id": "booking-uuid",
        "tour": {
          "id": "tour-uuid",
          "name": "Tour Đà Lạt 3N2Đ",
          "location": "Lâm Đồng"
        },
        "total_price": 3200000,
        "commission_rate": 15.0,
        "admin_commission": 480000,
        "agency_earnings": 2720000,
        "booking_date": "2025-07-15T09:00:00.000Z",
        "calculated_at": "2025-07-16T14:30:00.000Z"
      }
    ]
  }
}
```

---

## 🎨 Frontend Implementation Guide

### 1. Admin Dashboard - Commission Overview Component
```javascript
// React component example
const AdminCommissionOverview = () => {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchCommissionOverview(period);
  }, [period]);

  const fetchCommissionOverview = async (period) => {
    const response = await fetch(`/api/dashboard/commissions/admin/overview?period=${period}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const result = await response.json();
    setData(result.data);
  };

  return (
    <div className="commission-dashboard">
      <div className="period-selector">
        <button onClick={() => setPeriod('month')} className={period === 'month' ? 'active' : ''}>
          Tháng này
        </button>
        <button onClick={() => setPeriod('quarter')} className={period === 'quarter' ? 'active' : ''}>
          Quý này
        </button>
        <button onClick={() => setPeriod('year')} className={period === 'year' ? 'active' : ''}>
          Năm này
        </button>
      </div>

      {data && (
        <>
          <div className="overview-cards">
            <div className="card">
              <h3>Tổng Booking</h3>
              <p className="number">{data.overview.total_bookings}</p>
            </div>
            <div className="card">
              <h3>Doanh Thu</h3>
              <p className="number">{data.overview.total_revenue.toLocaleString()} VNĐ</p>
            </div>
            <div className="card">
              <h3>Hoa Hồng Admin</h3>
              <p className="number">{data.overview.total_admin_commission.toLocaleString()} VNĐ</p>
            </div>
            <div className="card">
              <h3>Tỷ Lệ TB</h3>
              <p className="number">{data.overview.avg_commission_rate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="charts-section">
            <div className="top-agencies">
              <h4>Top Agencies</h4>
              {data.top_agencies.map(agency => (
                <div key={agency.agency_id} className="agency-item">
                  <span>{agency.agency_name}</span>
                  <span>{agency.admin_commission.toLocaleString()} VNĐ</span>
                </div>
              ))}
            </div>

            <div className="monthly-chart">
              <h4>Biểu Đồ Hoa Hồng Theo Tháng</h4>
              {/* Chart component here */}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
```

### 2. Agency Dashboard - Commission Stats Component
```javascript
const AgencyCommissionStats = () => {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchCommissionStats(period);
  }, [period]);

  const fetchCommissionStats = async (period) => {
    const response = await fetch(`/api/dashboard/commissions/agency/stats?period=${period}`, {
      headers: { 'Authorization': `Bearer ${agencyToken}` }
    });
    const result = await response.json();
    setStats(result.data);
  };

  return (
    <div className="agency-commission-dashboard">
      <div className="stats-overview">
        <div className="stat-card">
          <h3>Thu Nhập</h3>
          <p className="earning">{stats?.stats.agency_earnings.toLocaleString()} VNĐ</p>
          <small>Hoa hồng đã trả: {stats?.stats.admin_commission_paid.toLocaleString()} VNĐ</small>
        </div>
        
        <div className="stat-card">
          <h3>Tỷ Lệ Hoa Hồng</h3>
          <p className="rate">{stats?.current_commission_rate}%</p>
          <small>{stats?.stats.total_bookings} booking thành công</small>
        </div>

        <div className="stat-card">
          <h3>Chờ Thanh Toán</h3>
          <p className="pending">{stats?.stats.pending_withdrawal.toLocaleString()} VNĐ</p>
          <button className="withdraw-btn">Rút Tiền</button>
        </div>
      </div>

      <div className="top-tours">
        <h4>Top Tours Của Tôi</h4>
        {stats?.top_tours.map(tour => (
          <div key={tour.tour_id} className="tour-item">
            <span>{tour.tour_name}</span>
            <span>{tour.booking_count} bookings</span>
            <span>{tour.agency_earnings.toLocaleString()} VNĐ</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. CSS Styling Example
```css
.commission-dashboard {
  padding: 20px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.card h3 {
  color: #666;
  margin-bottom: 10px;
  font-size: 14px;
  text-transform: uppercase;
}

.card .number {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

.period-selector {
  margin-bottom: 20px;
}

.period-selector button {
  padding: 8px 16px;
  margin-right: 10px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.period-selector button.active {
  background: #007bff;
  color: white;
}

.agency-item, .tour-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.earning {
  color: #27ae60;
  font-size: 24px;
  font-weight: bold;
}

.rate {
  color: #3498db;
  font-size: 24px;
  font-weight: bold;
}

.pending {
  color: #f39c12;
  font-size: 24px;
  font-weight: bold;
}

.withdraw-btn {
  background: #27ae60;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}
```

---

**🚀 Hệ thống hoa hồng đã sẵn sàng sử dụng!**
