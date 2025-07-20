# 📊 **PHÂN TÍCH TOÀN DIỆN HỆ THỐNG BACKEND TOUR BOOKING**

## 🏗️ **TỔNG QUAN KIẾN TRÚC**

### **Tech Stack**
- **Framework**: Node.js + Express.js
- **Database**: MySQL với Sequelize ORM
- **Authentication**: JWT + bcrypt
- **Payment**: VNPay + MoMo integration
- **Other Libraries**: cors, express-rate-limit, node-cron, nodemailer

### **Cấu trúc thư mục**
```
BE-tour-booking/
├── controllers/          # Business logic handlers
├── models/              # Sequelize models (Database schema)
├── routes/              # API endpoints definitions
├── middlewares/         # Auth, validation, rate limiting
├── services/            # Business services (Commission, etc)
├── jobs/               # Background jobs (Cron)
├── utils/              # Helper utilities (JWT, etc)
├── app.js              # Main application setup
└── server.js           # Server entry point
```

---

## 🔐 **1. HỆ THỐNG XÁC THỰC (AUTHENTICATION)**

### **Endpoints:**
```http
POST /api/auth/register           # Đăng ký người dùng
POST /api/auth/login              # Đăng nhập  
POST /api/auth/logout             # Đăng xuất (yêu cầu auth)
POST /api/auth/reset-password/:token  # Reset password
GET  /api/auth/me                 # Lấy thông tin user hiện tại
PUT  /api/auth/me                 # Cập nhật thông tin user
```

### **User Roles:**
- **user**: Khách hàng đặt tour
- **agency**: Đại lý bán tour
- **admin**: Quản trị viên hệ thống

### **Flow đăng ký/đăng nhập:**
```
1. User → POST /api/auth/register { username, email, password, role }
2. System → Hash password with bcrypt → Save to database
3. User → POST /api/auth/login { email, password }
4. System → Validate → Generate JWT token → Return user info + token
```

### **User Model Structure:**
```javascript
User {
  id: UUID (Primary Key),
  username: STRING,
  email: STRING (Unique),
  password_hash: STRING,
  role: STRING ('user', 'admin', 'agency'),
  status: ENUM('active', 'inactive'),
  temp_password_token: STRING,
  name: STRING,
  isVerified: BOOLEAN
}
```

---

## 🏢 **2. HỆ THỐNG AGENCY (ĐẠI LÝ)**

### **Endpoints:**
```http
POST /api/agencies/public-request     # Yêu cầu trở thành agency (public)
PUT  /api/agencies/approve/:id        # Admin duyệt agency
GET  /api/agencies                    # Admin xem danh sách agency
GET  /api/agencies/:id                # Xem chi tiết agency
GET  /api/agencies/by-user/:userId    # Lấy agency theo user_id
```

### **Agency Management Flow:**
```
1. User đăng ký tài khoản với role="user"
2. User → POST /api/agencies/public-request (có rate limit + captcha)
3. Admin → PUT /api/agencies/approve/:id
4. System → Update user role thành "agency" → Enable agency features
```

### **Agency Features:**
- Tạo/quản lý tours
- Xem bookings của tours mình
- Thống kê doanh thu và hoa hồng
- Quản lý payments

### **Security Features:**
- Rate limiting cho public requests
- Captcha validation
- Admin approval workflow

---

## 🗺️ **3. HỆ THỐNG TOUR & LOCATION**

### **Core Tour Endpoints:**
```http
GET  /api/tours                       # Lấy danh sách tất cả tours
GET  /api/tours/:id                   # Lấy tour theo ID
POST /api/tours                       # Tạo tour mới (Agency only)
PUT  /api/tours/:id                   # Cập nhật tour (Agency only)  
DELETE /api/tours/:id                 # Xóa tour (Agency only)
GET  /api/tours/my-agency             # Tours của agency hiện tại
GET  /api/tours/with-promotions       # Tours có khuyến mãi
```

### **Extended Tour Endpoints:**
```http
GET /api/tours/:id/departures         # Tour + ngày khởi hành
GET /api/tours/:id/categories         # Tour + danh mục
GET /api/tours/:id/included-services  # Tour + dịch vụ bao gồm
GET /api/tours/:id/excluded-services  # Tour + dịch vụ loại trừ
GET /api/tours/:id/hotels            # Tour + khách sạn
GET /api/tours/:id/itineraries       # Tour + hành trình
GET /api/tours/:id/complete          # Tour với tất cả thông tin
```

### **Location & Destination:**
```http
GET /api/tours/location/:locationId       # Tours theo location
GET /api/tours/destination/:destinationId # Tours theo destination
GET /api/locations                        # Danh sách locations
GET /api/destinations                     # Danh sách destinations
```

### **Tour Model Structure:**
```javascript
Tour {
  id: UUID,
  agency_id: UUID,
  name: STRING,
  description: TEXT,
  location: STRING,
  destination: STRING,
  departure_location: STRING, 
  price: FLOAT,
  promotion_id: UUID,
  tour_type: ENUM('Trong nước', 'Quốc tế'),
  max_participants: INTEGER,
  min_participants: INTEGER,
  status: ENUM('Chờ duyệt', 'Đang hoạt động', 'Ngừng hoạt động', 'Đã hủy')
}
```

### **Tour Business Logic:**
- Agency chỉ có thể quản lý tours của mình
- Admin có thể duyệt/từ chối tours
- Tours phải có ít nhất 1 departure date
- Support nhiều categories, hotels, services per tour
- Auto-status management workflow

---

## 📅 **4. HỆ THỐNG BOOKING (ĐẶT TOUR)**

### **Core Booking Endpoints:**
```http
GET  /api/bookings                    # Danh sách bookings (filter by user_id)
GET  /api/bookings/:id                # Chi tiết booking
POST /api/bookings                    # Tạo booking mới
PUT  /api/bookings/:id                # Cập nhật booking
DELETE /api/bookings/:id              # Xóa booking
POST /api/bookings/validate-promotion # Validate mã giảm giá
```

### **Agency Booking Management:**
```http
GET /api/agency/bookings              # Agency xem bookings của tours mình
GET /api/agency/bookings/:id          # Chi tiết booking
GET /api/agency/bookings/stats        # Thống kê booking
GET /api/agency/bookings/revenue      # Thống kê revenue
GET /api/agency/bookings/customers    # Danh sách khách hàng
```

### **Admin Booking Management:**
```http
GET    /api/admin/bookings              # Quản lý tất cả bookings
GET    /api/admin/bookings/:id          # Chi tiết booking
PUT    /api/admin/bookings/:id/status   # Cập nhật trạng thái
DELETE /api/admin/bookings/:id          # Xóa booking
PUT    /api/admin/bookings/bulk/status  # Cập nhật hàng loạt
GET    /api/admin/bookings/export/csv   # Export CSV
```

### **Booking Flow:**
```
1. User browsing → GET /api/tours
2. User select tour + departure date
3. User validate promotion → POST /api/bookings/validate-promotion
4. User create booking → POST /api/bookings
   ├─ Validate departure date (≥ 3 days from now)
   ├─ Create booking (status: 'pending')
   ├─ Create guest information records
   └─ Auto expire after 15 minutes if no payment
5. Background job checks expired bookings every 15 minutes
```

### **Booking Request Example:**
```json
{
  "user_id": "uuid",
  "tour_id": "uuid", 
  "departure_date_id": "uuid",
  "promotion_id": "uuid", // optional
  "original_price": 1000000,
  "discount_amount": 200000, // nếu có promotion
  "total_price": 800000,
  "number_of_adults": 2,
  "number_of_children": 1,
  "guests": [
    {
      "full_name": "Nguyễn Văn A",
      "email": "a@example.com",
      "phone": "0123456789",
      "date_of_birth": "1990-01-01",
      "gender": "male",
      "is_representative": true
    }
  ]
}
```

### **Booking Model:**
```javascript
Booking {
  id: UUID,
  user_id: UUID,
  tour_id: UUID,
  departure_date_id: UUID,
  promotion_id: UUID,
  original_price: DECIMAL(12,2),
  discount_amount: DECIMAL(12,2),
  total_price: DECIMAL(12,2),
  booking_date: DATE,
  status: ENUM('pending', 'confirmed', 'cancelled', 'expired'),
  number_of_adults: INTEGER,
  number_of_children: INTEGER,
  // Commission fields:
  commission_rate: DECIMAL(5,2),
  admin_commission: DECIMAL(12,2),
  agency_amount: DECIMAL(12,2),
  commission_calculated_at: DATE
}
```

### **Booking Business Rules:**
- Departure date phải ≥ 3 ngày từ thời điểm đặt
- Auto expire sau 15 phút nếu không thanh toán
- Support guest information với representative
- Promotion validation với discount calculation
- Commission calculation tự động khi confirmed

---

## 💳 **5. HỆ THỐNG PAYMENT (THANH TOÁN)**

### **Payment Query Endpoints:**
```http
GET /api/payments                     # Danh sách payments
GET /api/payments/:id                 # Payment theo ID
GET /api/payments/details/:orderId    # Payment theo orderId
GET /api/payments/by-booking/:bookingId # Payment theo bookingId
```

### **VNPay Integration:**
```http
GET /api/payments/vnpay/create-payment?bookingId={id}  # Tạo VNPay URL
GET /api/payments/vnpay/return        # VNPay callback
```

### **MoMo Integration:**
```http
POST /api/momo/create-payment         # Tạo MoMo payment
POST /api/momo/ipn                    # MoMo IPN callback
GET  /api/momo/return                 # MoMo redirect callback
GET  /api/momo/tour/:id/confirmation  # Trang xác nhận
```

### **Agency Payment Management:**
```http
GET /api/agency/payments              # Agency xem payments
GET /api/agency/payments/:id          # Chi tiết payment
GET /api/agency/payments/stats        # Thống kê payment
```

### **Admin Payment Management:**
```http
GET /api/admin/payments               # Admin quản lý payments
GET /api/admin/payments/:id           # Chi tiết payment
GET /api/admin/payments/failed        # Failed payments
PUT /api/admin/payments/:id/retry     # Retry payment
```

### **Payment Flow:**

#### **VNPay Flow:**
```
1. User → GET /api/payments/vnpay/create-payment?bookingId={id}
2. System → Validate booking → Generate VNPay URL → Create payment (pending)
3. User redirected to VNPay → Complete payment
4. VNPay → GET /api/payments/vnpay/return with result params
5. System → Verify signature → Update payment & booking status
6. Redirect user to success/failure page
```

#### **MoMo Flow:**
```
1. User → POST /api/momo/create-payment { tourId }
2. System → Call MoMo API → Create payment URL
3. User redirected to MoMo → Complete payment
4. MoMo → POST /api/momo/ipn { orderId, resultCode }
5. System → Update payment status based on resultCode
6. MoMo → GET /api/momo/return → Redirect to confirmation page
```

### **Payment Model:**
```javascript
Payment {
  id: UUID,
  booking_id: UUID,
  order_id: STRING, // orderId từ VNPay/MoMo
  amount: DECIMAL(12,2),
  payment_date: DATE,
  payment_method: STRING, // 'VNPay', 'MoMo'
  status: ENUM('pending', 'completed', 'failed')
}
```

### **Payment Status Transitions:**
```
Payment: pending → completed (success) / failed (error)
Booking: pending → confirmed (payment success) / expired (timeout)
```

### **Payment Configuration:**
```javascript
// VNPay Config
{
  vnp_TmnCode: "UC8YUKOK",
  vnp_HashSecret: "SWC2RBQG4FJUBH9FQ0RKX1LU7BAP35FD", 
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl: "http://localhost:5001/api/payments/vnpay/return"
}

// MoMo Config
{
  accessKey: 'F8BBA842ECF85',
  secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  partnerCode: 'MOMO',
  redirectUrl: 'http://localhost:3000/tour/{tourId}/confirmation',
  ipnUrl: 'http://localhost:5001/api/momo/ipn'
}
```

---

## 🎯 **6. HỆ THỐNG KHUYẾN MÃI**

### **Promotion Endpoints:**
```http
GET  /api/promotions                  # Danh sách khuyến mãi
GET  /api/promotions/:id              # Chi tiết khuyến mãi
POST /api/promotions                  # Tạo khuyến mãi mới
PUT  /api/promotions/:id              # Cập nhật khuyến mãi
DELETE /api/promotions/:id            # Xóa khuyến mãi
```

### **Promotion Validation Logic:**
```javascript
// POST /api/bookings/validate-promotion
{
  "promotion_code": "JULY2507",
  "tour_price": 5800000
}

// Response
{
  "valid": true,
  "promotion": {
    "id": "uuid",
    "code": "JULY2507", 
    "description": "Giảm giá cuối tháng",
    "discount_amount": 5800000
  },
  "pricing": {
    "original_price": 5800000,
    "discount_amount": 5800000,
    "final_price": 0,
    "savings": 5800000
  }
}
```

### **Promotion Model:**
```javascript
Promotion {
  id: UUID,
  code: STRING (Unique),
  description: STRING,
  discount_amount: DECIMAL(5,2), // Phần trăm giảm giá
  start_date: DATE,
  end_date: DATE,
  status: ENUM('active', 'inactive'),
  max_usage: INTEGER,
  current_usage: INTEGER
}
```

### **Promotion Business Rules:**
- Code được chuẩn hóa (trim + uppercase)
- Kiểm tra thời gian hiệu lực (start_date ≤ now ≤ end_date)
- Tính discount theo phần trăm của tour price
- Support max usage limit
- Có thể gán specific cho tours

---

## 💰 **7. HỆ THỐNG HOA HỒNG (COMMISSION)**

### **Commission Calculation Endpoints:**
```http
POST /api/admin/commissions/calculate/:bookingId    # Tính hoa hồng 1 booking
POST /api/admin/commissions/calculate-pending       # Tính hoa hồng hàng loạt
GET  /api/admin/commissions/report                  # Báo cáo hoa hồng
POST /api/commissions/reversal                      # Thu hồi hoa hồng (cancel booking)
```

### **Commission Settings Management:**
```http
GET    /api/admin/commissions/settings       # Lấy cấu hình hoa hồng
POST   /api/admin/commissions/settings       # Tạo cấu hình mới
PUT    /api/admin/commissions/settings/:id   # Cập nhật cấu hình
DELETE /api/admin/commissions/settings/:id   # Xóa cấu hình
```

### **Commission Dashboard APIs:**

#### **Admin Dashboard:**
```http
GET /api/dashboard/commissions/admin/overview    # Tổng quan doanh thu & hoa hồng
GET /api/dashboard/commissions/admin/pending     # Bookings chưa tính hoa hồng
```

**Admin Overview Response Example:**
```json
{
  "period": "quarter",
  "totalBookings": 156,
  "totalRevenue": "312000000.00",
  "adminCommission": "46800000.00",
  "commissionRate": "15.00",
  "topAgencies": [
    {
      "agency_name": "Du lịch Việt",
      "booking_count": 45,
      "total_revenue": "125000000.00"
    }
  ],
  "monthlyChart": [...],
  "pendingCommissions": 12
}
```

#### **Agency Dashboard:**
```http
GET /api/dashboard/commissions/agency/stats      # Thống kê thu nhập agency
GET /api/dashboard/commissions/agency/history    # Lịch sử hoa hồng
```

**Agency Stats Response Example:**
```json
{
  "totalBookings": 28,
  "agencyEarnings": "55250000.00",
  "commissionRate": "15.00",
  "averageBookingValue": "1973214.29",
  "topTours": [
    {
      "tour_name": "Tour Hạ Long 2N1Đ",
      "booking_count": 12,
      "total_revenue": "30000000.00"
    }
  ],
  "pendingWithdrawal": "12500000.00",
  "lastCommissionDate": "2025-07-15"
}
```

### **Commission Models:**

#### **CommissionSetting Model:**
```javascript
CommissionSetting {
  id: UUID,
  agency_id: UUID, // null = áp dụng cho tất cả
  tour_category_id: UUID, // null = áp dụng cho tất cả categories
  min_booking_value: DECIMAL(12,2), // Giá trị booking tối thiểu
  max_booking_value: DECIMAL(12,2), // Giá trị booking tối đa
  commission_rate: DECIMAL(5,2), // Tỷ lệ hoa hồng (%)
  effective_from: DATE,
  effective_to: DATE,
  status: ENUM('active', 'inactive')
}
```

#### **Commission Model (in Booking):**
```javascript
// Các trường commission trong Booking model
{
  commission_rate: DECIMAL(5,2), // VD: 15.00 = 15%
  admin_commission: DECIMAL(12,2), // Số tiền admin nhận
  agency_amount: DECIMAL(12,2), // Số tiền agency nhận
  commission_calculated_at: DATE // Thời điểm tính
}
```

### **Commission Business Logic:**
```javascript
// Commission Calculation Flow
1. Booking confirmed → Trigger commission calculation
2. Find applicable CommissionSetting:
   - By agency_id (specific > general)
   - By tour category
   - By booking value range
   - By effective date
3. Calculate amounts:
   - admin_commission = total_price * commission_rate / 100
   - agency_amount = total_price - admin_commission
4. Update booking with commission data
5. Log commission transaction
```

### **Commission Service Functions:**
- `calculateCommission(bookingId)` - Tính hoa hồng cho 1 booking
- `calculateBatchCommissions()` - Tính hàng loạt pending bookings
- `getCommissionReport(period, filters)` - Báo cáo chi tiết
- `getAgencyCommissionStats(agencyId)` - Thống kê theo agency
- `reverseCommission(bookingId)` - Thu hồi hoa hồng khi hủy booking

---

## 🔍 **8. HỆ THỐNG TÌM KIẾM & DISCOVERY**

### **Search Endpoints:**
```http
POST /api/search/log                  # Ghi log tìm kiếm người dùng
GET  /api/search/top                  # Top 5 locations được tìm nhiều nhất
GET  /api/search/top-destinations     # Top 5 destinations nổi bật
```

### **Data Analytics Endpoints:**
```http
GET /api/data                         # General data endpoint
```

### **Search Features:**
- **Search Logging**: Ghi lại hành vi tìm kiếm để phân tích
- **Popular Suggestions**: Cung cấp top search suggestions
- **Location-based Search**: Tìm kiếm theo location/destination
- **Trend Analysis**: Phân tích xu hướng tìm kiếm

### **SearchLog Model:**
```javascript
SearchLog {
  id: UUID,
  user_id: UUID, // nullable cho anonymous search
  search_term: STRING,
  search_type: ENUM('location', 'destination', 'tour', 'general'),
  result_count: INTEGER,
  clicked_result: BOOLEAN,
  ip_address: STRING,
  user_agent: STRING,
  created_at: DATE
}
```

### **Search Business Logic:**
```javascript
// Search Flow
1. User searches → Frontend calls backend APIs
2. Backend logs search → POST /api/search/log
3. Return search results + popular suggestions
4. Track click-through rates
5. Generate trending reports for admin
```

---

## ⭐ **9. HỆ THỐNG REVIEW & RATING**

### **Review Endpoints:**
```http
GET  /api/reviews                     # Danh sách reviews
GET  /api/reviews/:id                 # Chi tiết review
POST /api/reviews                     # Tạo review mới (User only)
PUT  /api/reviews/:id                 # Cập nhật review (Author only)
DELETE /api/reviews/:id               # Xóa review (Author/Admin)
```

### **Review Model:**
```javascript
Review {
  id: UUID,
  user_id: UUID,
  tour_id: UUID,
  booking_id: UUID, // Chỉ user đã book mới được review
  rating: INTEGER, // 1-5 stars
  title: STRING,
  content: TEXT,
  helpful_count: INTEGER,
  status: ENUM('pending', 'approved', 'rejected'),
  admin_response: TEXT, // Agency/Admin có thể response
  created_at: DATE,
  updated_at: DATE
}
```

### **Review Business Rules:**
- Chỉ user đã booking mới được review
- Một booking chỉ có thể review một lần
- Review cần admin approve trước khi hiển thị
- Support rating aggregation cho tour
- Agency có thể response lại reviews

---

## 🏨 **10. HỆ THỐNG KHÁCH SẠN & DỊCH VỤ**

### **Hotel Management:**
```http
GET  /api/hotels                      # Danh sách khách sạn (có thể filter by star_rating, location_id)
GET  /api/hotels/:id                  # Chi tiết khách sạn
GET  /api/hotels/star/:star_rating    # Lấy khách sạn theo số sao (1-5)
POST /api/hotels                      # Tạo khách sạn mới
PUT  /api/hotels/:id                  # Cập nhật khách sạn
DELETE /api/hotels/:id                # Xóa khách sạn
GET  /api/hotel-locations             # Khách sạn theo location
POST /api/tour-hotels                 # Gán khách sạn cho tour
```

### **Service Management:**
```http
GET  /api/included-services           # Dịch vụ bao gồm
GET  /api/excluded-services           # Dịch vụ loại trừ
POST /api/tour-included-services      # Gán dịch vụ bao gồm cho tour
POST /api/tour-excluded-services      # Gán dịch vụ loại trừ cho tour
```

### **Models:**

#### **Hotel Model:**
```javascript
Hotel {
  id: UUID,
  ten_khach_san: STRING, // Tên khách sạn
  ten_phong: STRING, // Tên phòng
  star_rating: INTEGER, // Số sao (1-5), thay thế loai_phong
  location_id: UUID,
  // Removed: loai_phong (replaced by star_rating)
  // Additional fields that could be added:
  // address: STRING,
  // phone: STRING, 
  // email: STRING,
  // amenities: JSON,
  // description: TEXT,
  // images: JSON,
  // status: ENUM('active', 'inactive')
}
```

#### **IncludedService Model:**
```javascript
IncludedService {
  id: UUID,
  name: STRING,
  description: TEXT,
  icon: STRING, // Icon identifier
  category: ENUM('transport', 'meal', 'accommodation', 'activity', 'other')
}
```

#### **ExcludedService Model:**
```javascript
ExcludedService {
  id: UUID,
  name: STRING,
  description: TEXT,
  estimated_cost: DECIMAL(10,2), // Chi phí ước tính
  category: ENUM('transport', 'meal', 'personal', 'optional', 'other')
}
```

---

## 🗓️ **11. HỆ THỐNG LỊCH TRÌNH & NGÀY KHỞI HÀNH**

### **Itinerary Management:**
```http
GET  /api/itineraries                 # Danh sách lịch trình
GET  /api/itineraries/:id             # Chi tiết lịch trình
POST /api/itineraries                 # Tạo lịch trình mới
PUT  /api/itineraries/:id             # Cập nhật lịch trình
DELETE /api/itineraries/:id           # Xóa lịch trình
GET  /api/itinerary-locations         # Locations trong lịch trình
```

### **Departure Date Management:**
```http
GET  /api/departure-dates             # Danh sách ngày khởi hành
GET  /api/departure-dates/:id         # Chi tiết ngày khởi hành
POST /api/departure-dates             # Tạo ngày khởi hành mới
PUT  /api/departure-dates/:id         # Cập nhật ngày khởi hành
DELETE /api/departure-dates/:id       # Xóa ngày khởi hành
```

### **Models:**

#### **Itinerary Model:**
```javascript
Itinerary {
  id: UUID,
  tour_id: UUID,
  day_number: INTEGER, // Ngày thứ mấy trong tour
  title: STRING, // Tiêu đề ngày (VD: "Ngày 1: Khám phá Hạ Long")
  description: TEXT, // Mô tả chi tiết hoạt động
  activities: JSON, // Array các hoạt động
  meals: JSON, // Bữa ăn (breakfast, lunch, dinner)
  accommodation: STRING, // Nơi nghỉ đêm
  notes: TEXT // Ghi chú đặc biệt
}
```

#### **DepartureDate Model:**
```javascript
DepartureDate {
  id: UUID,
  tour_id: UUID,
  departure_date: DATE, // Ngày khởi hành
  end_date: DATE, // Ngày kết thúc
  number_of_days: INTEGER,
  number_of_nights: INTEGER,
  available_slots: INTEGER, // Số chỗ còn trống
  booked_slots: INTEGER, // Số chỗ đã đặt
  price_adjustment: DECIMAL(10,2), // Điều chỉnh giá (+ hoặc -)
  status: ENUM('available', 'full', 'cancelled')
}
```

### **Business Logic:**
- Tour phải có ít nhất 1 departure date
- Itinerary được sắp xếp theo day_number
- Auto-calculate end_date dựa trên departure_date + number_of_days
- Kiểm tra available_slots khi booking
- Support seasonal pricing với price_adjustment

---

## 🏷️ **12. HỆ THỐNG DANH MỤC & PHÂN LOẠI**

### **Category Management:**
```http
GET  /api/tour-categories             # Danh sách danh mục tour
GET  /api/tour-categories/:id         # Chi tiết danh mục
POST /api/tour-categories             # Tạo danh mục mới
PUT  /api/tour-categories/:id         # Cập nhật danh mục
DELETE /api/tour-categories/:id       # Xóa danh mục
POST /api/tour-tour-categories        # Gán danh mục cho tour
```

### **Location & Province:**
```http
GET /api/locations                    # Danh sách locations
GET /api/provinces                    # Danh sách tỉnh thành
GET /api/destinations                 # Danh sách destinations
```

### **Models:**

#### **TourCategory Model:**
```javascript
TourCategory {
  id: UUID,
  name: STRING, // VD: "Biển đảo", "Văn hóa lịch sử"
  description: TEXT,
  icon: STRING, // Icon identifier
  color: STRING, // Hex color code
  sort_order: INTEGER,
  status: ENUM('active', 'inactive')
}
```

#### **Location Model:**
```javascript
Location {
  id: UUID,
  name: STRING, // VD: "Hạ Long", "Đà Lạt"
  province_id: UUID,
  description: TEXT,
  coordinates: JSON, // {lat, lng}
  image_url: STRING,
  popular_level: INTEGER, // 1-5 (cho search ranking)
  status: ENUM('active', 'inactive')
}
```

---

## 🛡️ **13. MIDDLEWARE & SECURITY**

### **Authentication Middleware:**
```javascript
// protect(['user', 'admin', 'agency'])
- JWT validation
- Role-based access control
- Token expiration check
- User status verification

// ensureAgencyApproved
- Kiểm tra agency đã được admin duyệt
- Chỉ approved agency mới có thể tạo/sửa tours
```

### **Security Middleware:**
```javascript
// Rate Limiting
app.use('/api/agencies/public-request', rateLimiter);
- Giới hạn số request per IP per time window
- Prevent spam và abuse

// Captcha Validation
app.use('/api/agencies/public-request', validateCaptcha);
- Xác thực captcha cho sensitive operations
- Anti-bot protection

// CORS Configuration
app.use(cors());
- Cross-origin resource sharing setup
- Configure allowed origins, methods, headers
```

### **Input Validation & Sanitization:**
- Email format validation
- Password strength requirements
- SQL injection prevention (Sequelize ORM)
- XSS protection
- Input length limits

### **Authentication Flow:**
```javascript
// JWT Token Structure
{
  id: user.id,
  email: user.email,
  role: user.role,
  iat: issued_at_time,
  exp: expiration_time
}

// Password Security
- bcrypt hashing với salt rounds = 10
- Password không bao giờ trả về trong response
- Support reset password với temporary token
```

---

## ⏰ **14. BACKGROUND JOBS & AUTOMATION**

### **Cron Jobs Setup:**
```javascript
// Server.js - Cron job scheduling
cron.schedule("*/15 * * * *", async () => {
  console.log("[Cron] Đang kiểm tra booking hết hạn...");
  await expireBookingsJob();
});
```

### **Background Tasks:**

#### **Booking Expiration Job:**
```javascript
// jobs/expireBookings.js
- Chạy mỗi 15 phút
- Tìm bookings có status 'pending' và created > 15 phút
- Update status thành 'expired'
- Giải phóng slots cho departure dates
- Log expired bookings cho tracking
```

#### **Commission Calculation Job:**
```javascript
// Có thể được trigger manual hoặc scheduled
- Tìm confirmed bookings chưa tính hoa hồng
- Batch calculate commissions
- Update booking records với commission data
- Generate commission reports
```

#### **Notification Jobs:**
```javascript
// Planned background jobs
- Send booking confirmation emails
- Send payment reminder emails
- Send departure date reminders
- Send promotional emails
- Generate analytics reports
```

### **Job Management:**
```javascript
// Job monitoring và error handling
- Log job execution status
- Retry failed jobs
- Alert admin khi job fails
- Performance monitoring
```

---

## 📧 **15. THÔNG TIN LIÊN QUAN & FAQ**

### **Information Booking:**
```http
GET /api/information-booking          # Thông tin booking guests
POST /api/information-booking         # Tạo thông tin guest mới
```

### **FAQ System:**
```http
GET /api/faqs                         # Danh sách câu hỏi thường gặp
GET /api/faqs/:id                     # Chi tiết FAQ
POST /api/faqs                        # Tạo FAQ mới
PUT /api/faqs/:id                     # Cập nhật FAQ
DELETE /api/faqs/:id                  # Xóa FAQ
```

### **Tour Images:**
```http
GET /api/tour-images                  # Hình ảnh tour
POST /api/tour-images                 # Upload hình ảnh mới
PUT /api/tour-images/:id              # Cập nhật hình ảnh
DELETE /api/tour-images/:id           # Xóa hình ảnh
```

---

## 📊 **16. TỔNG KẾT ENDPOINTS & FEATURES**

### **Tổng số endpoints: ~100+ endpoints**

#### **Phân loại theo nhóm chức năng:**

1. **Authentication (6 endpoints)**
   - Register, Login, Logout, Profile, Password Reset

2. **Tours (25+ endpoints)**  
   - CRUD, Search, Categories, Services, Hotels, Itineraries
   - Agency tour management
   - Extended tour information APIs

3. **Bookings (20+ endpoints)**
   - User booking CRUD
   - Agency booking management  
   - Admin booking administration
   - Promotion validation
   - Bulk operations

4. **Payments (15+ endpoints)**
   - VNPay & MoMo integration
   - Payment queries & management
   - Agency & Admin payment oversight

5. **Agency Management (8+ endpoints)**
   - Registration workflow
   - Approval process
   - Agency-specific operations

6. **Commission System (10+ endpoints)**
   - Commission calculation & settings
   - Admin & Agency dashboards
   - Reporting & analytics

7. **Search & Discovery (5+ endpoints)**
   - Search logging & analytics
   - Popular destinations & locations
   - Trend analysis

8. **Supporting Services (30+ endpoints)**
   - Reviews, Hotels, Services, Categories
   - Locations, Itineraries, FAQs
   - Images, Information management

#### **Phân quyền truy cập:**

**Public Access:**
- Tour listings & details
- Search & discovery
- Promotion validation
- Location & destination info

**User Role:**
- Booking creation & management
- Payment processing
- Profile management
- Review submission

**Agency Role:**
- Tour CRUD operations (own tours only)
- Booking management (own tours only)  
- Revenue & commission stats
- Payment tracking

**Admin Role:**
- Full system management
- User & agency approval
- Commission settings & calculation
- System analytics & reporting
- Bulk operations

---

## ✅ **17. TRẠNG THÁI HIỆN TẠI & ĐÁNH GIÁ**

### **Hoàn thành tốt (✅):**
- **Authentication & Authorization system**: JWT-based với multi-role support
- **Tour management**: Complete CRUD với advanced features, categories, services
- **Booking system**: Full workflow với promotion, validation, auto-expiration
- **Payment integration**: VNPay + MoMo với proper callback handling
- **Commission system**: Flexible calculation với settings & dashboard
- **Agency workflow**: Registration → Approval → Management cycle
- **Database design**: Well-structured với proper relationships
- **Background jobs**: Cron-based automation cho booking expiration
- **Security measures**: Rate limiting, captcha, input validation
- **API organization**: Clear separation of concerns, proper routing

### **Cần cải thiện (🔧):**

#### **Technical Improvements:**
- **Error handling standardization**: Consistent error response format
- **API documentation**: Swagger/OpenAPI integration
- **Logging system**: Structured logging với log levels
- **Testing coverage**: Unit tests, integration tests
- **Performance optimization**: Query optimization, caching
- **Database indexing**: Performance tuning cho complex queries

#### **Feature Gaps:**
- **Email notification system**: Booking confirmations, reminders
- **File upload functionality**: Images, documents
- **Refund/cancellation flow**: Complete refund processing
- **Real-time notifications**: WebSocket integration
- **Data export/import**: CSV, Excel support
- **Mobile API optimizations**: Response size optimization

#### **Business Logic Enhancements:**
- **Dynamic pricing**: Seasonal, demand-based pricing
- **Inventory management**: Real-time slot tracking
- **Multi-currency support**: International tours
- **Advanced search**: Filters, sorting, faceted search
- **Recommendation engine**: Personalized tour suggestions
- **Loyalty program**: Point system, membership tiers

#### **DevOps & Deployment:**
- **Environment configuration**: Staging, production configs
- **Container deployment**: Docker setup
- **CI/CD pipeline**: Automated testing & deployment
- **Monitoring & alerting**: Application performance monitoring
- **Database migration management**: Version control for schema changes

#### **Security Enhancements:**
- **API versioning**: Backward compatibility
- **Request/response encryption**: Sensitive data protection
- **Audit logging**: Track all admin actions
- **2FA support**: Enhanced authentication
- **GDPR compliance**: Data privacy features

### **Architecture Quality Assessment:**

#### **Strengths:**
- **Modular design**: Clear separation between routes, controllers, models
- **Scalable structure**: Easy to add new features và endpoints
- **Database relationships**: Well-defined associations
- **Business logic separation**: Services layer cho complex operations
- **Security-first approach**: Authentication, authorization, validation

#### **Areas for improvement:**
- **Service layer consistency**: Not all business logic is in services
- **Error propagation**: Inconsistent error handling across layers
- **Configuration management**: Hard-coded values, missing env vars
- **Code documentation**: Inline comments và API docs
- **Testing infrastructure**: Missing test setup và coverage

---

## 🎯 **18. KHUYẾN NGHỊ PHÁT TRIỂN**

### **Ưu tiên cao (High Priority):**
1. **Standardize error handling** - Consistent error responses
2. **Add comprehensive logging** - Debug và monitor system health
3. **Implement email notifications** - Essential cho user experience
4. **Add API documentation** - Swagger integration
5. **Performance optimization** - Query optimization và caching

### **Ưu tiên trung bình (Medium Priority):**
1. **File upload system** - Image và document management
2. **Advanced search features** - Filters, sorting, pagination
3. **Real-time notifications** - WebSocket cho live updates
4. **Refund processing** - Complete cancellation workflow
5. **Testing infrastructure** - Unit và integration tests

### **Ưu tiên thấp (Low Priority):**
1. **Multi-currency support** - International expansion
2. **Recommendation engine** - AI-powered suggestions
3. **Mobile optimizations** - App-specific endpoints
4. **Advanced analytics** - Business intelligence features
5. **Loyalty program** - Customer retention features

### **Technical Debt:**
1. **Code refactoring** - Remove duplicate code, improve structure
2. **Database optimization** - Indexing, query performance
3. **Security audit** - Penetration testing, vulnerability assessment
4. **Configuration management** - Environment-specific configs
5. **Documentation update** - Keep docs in sync với code changes

---

## 📋 **KẾT LUẬN**

Hệ thống Backend Tour Booking này được xây dựng với architecture vững chắc và feature set khá hoàn chỉnh. Với ~100+ endpoints phục vụ đầy đủ workflow từ browsing tours → booking → payment → management, hệ thống đáp ứng tốt requirements của một nền tảng du lịch.

**Điểm mạnh chính:**
- Architecture modular, dễ maintain và scale
- Security được chú trọng với authentication, authorization, rate limiting
- Payment integration với 2 providers lớn (VNPay, MoMo)
- Commission system linh hoạt với dashboard
- Database design chu đáo với relationships rõ ràng

**Tổng thể:** Đây là một hệ thống backend chất lượng, ready cho production với minor improvements. Code structure professional, business logic comprehensive, và technical implementation solid.

**Phù hợp cho:** Startup du lịch, agency management platform, hoặc enterprise tour booking solution với capability để scale lên handle high traffic và complex business requirements.

---

*Báo cáo được tạo ngày 20/07/2025*  
*Repository: BE-tour-booking (Branch: BEFinal)*
