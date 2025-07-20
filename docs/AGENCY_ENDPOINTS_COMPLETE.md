# 🏢 **AGENCY ENDPOINTS - COMPLETE REFERENCE**

## 📋 **TỔNG QUAN**

Hệ thống cung cấp **đầy đủ API endpoints** cho Agency để quản lý business của mình, bao gồm:
- **🏢 Agency Management** - Quản lý thông tin agency 
- **🎯 Tour Management** - Quản lý tours riêng
- **📅 Booking Management** - Quản lý bookings của tours
- **💰 Payment Management** - Theo dõi thanh toán và revenue
- **📊 Statistics & Analytics** - Thống kê kinh doanh

---

## 🔐 **AUTHENTICATION & REQUIREMENTS**

### **Authentication Required:**
```
Authorization: Bearer <JWT_TOKEN>
Role: agency
Status: approved (agency phải được admin duyệt)
```

### **Middleware Stack:**
```javascript
protect(['agency'])           // Check JWT và role = agency
ensureAgencyApproved         // Check agency.status = 'approved'
```

---

## 🏢 **1. AGENCY MANAGEMENT** - `/api/agencies` & `/api/agency`

### **📝 Agency Registration & Profile:**

#### **POST /api/agencies/public-request**
**Purpose:** Đăng ký trở thành agency (public user)  
**Authentication:** None (public endpoint)  
**Body:**
```json
{
  "company_name": "ABC Travel Agency",
  "tax_id": "1234567890",
  "address": "123 Main St, City",
  "phone": "0123456789",
  "email": "contact@abc-travel.com",
  "website": "https://abc-travel.com",
  "business_license": "business_license_url"
}
```

#### **GET /api/agencies** 
**Purpose:** Admin xem danh sách tất cả agencies  
**Authentication:** Admin only  
**Response:** List of all agencies with status

#### **GET /api/agencies/:id**
**Purpose:** Xem chi tiết agency  
**Authentication:** Admin hoặc chính agency đó  
**Response:** Agency details with full information

#### **PUT /api/agencies/approve/:id**
**Purpose:** Admin duyệt agency  
**Authentication:** Admin only  
**Body:**
```json
{
  "status": "approved",
  "notes": "Agency approved successfully"
}
```

#### **PUT /api/agencies/toggle-lock/:id**
**Purpose:** Admin khóa/mở khóa agency  
**Authentication:** Admin only  

#### **DELETE /api/agencies/:id**
**Purpose:** Admin xóa agency  
**Authentication:** Admin only  

#### **GET /api/agencies/by-user/:userId**
**Purpose:** Lấy agency info theo user ID  
**Authentication:** Required  

---

## 🎯 **2. TOUR MANAGEMENT** - `/api/tours`

### **Agency Tour Operations:**

#### **GET /api/tours/my-agency**
**Purpose:** Lấy danh sách tours của agency  
**Authentication:** Agency  
**Query Parameters:**
```
?page=1&limit=10&status=active&search=tour_name&sort=created_at
```
**Response:**
```json
{
  "success": true,
  "data": {
    "tours": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

#### **POST /api/tours**
**Purpose:** Tạo tour mới  
**Authentication:** Agency (approved)  
**Body:**
```json
{
  "name": "Tour Đà Lạt Mộng Mơ 3N2Đ",
  "description": "Khám phá thành phố ngàn hoa...",
  "price": 2900000,
  "number_of_days": 3,
  "number_of_nights": 2,
  "max_participants": 20,
  "min_participants": 4,
  "destination": "Đà Lạt",
  "location": "TP.HCM",
  "category_ids": ["cat1", "cat2"],
  "included_services": ["service1", "service2"],
  "excluded_services": ["service3"],
  "hotels": ["hotel1", "hotel2"],
  "itinerary": [...]
}
```

#### **GET /api/tours/:id**
**Purpose:** Xem chi tiết tour  
**Authentication:** Public (nếu tour active) hoặc Agency owner  

#### **PUT /api/tours/:id**
**Purpose:** Cập nhật tour  
**Authentication:** Agency (chỉ tour của mình)  
**Body:** Same as POST với các field cần update

#### **DELETE /api/tours/:id**
**Purpose:** Xóa tour  
**Authentication:** Agency (chỉ tour của mình, không có booking)  

### **Tour Extended Info:**

#### **GET /api/tours/:id/complete**
**Purpose:** Lấy thông tin tour đầy đủ (relations)  
**Response:** Tour with departures, hotels, services, itinerary...

#### **GET /api/tours/:id/departures**
**Purpose:** Lấy danh sách ngày khởi hành của tour  

#### **POST /api/departure-dates**
**Purpose:** Tạo ngày khởi hành cho tour  
**Authentication:** Agency  
**Body:**
```json
{
  "tour_id": "tour-uuid",
  "departure_date": "2025-08-15",
  "number_of_days": 3,
  "available_slots": 20,
  "price_adjustment": 0
}
```

---

## 📅 **3. BOOKING MANAGEMENT** - `/api/agency/bookings`

### **📊 Dashboard & Statistics:**

#### **GET /api/agency/bookings/stats**
**Purpose:** Thống kê booking tổng quan  
**Authentication:** Agency  
**Response:**
```json
{
  "success": true,
  "data": {
    "total_bookings": 156,
    "pending_bookings": 12,
    "confirmed_bookings": 134,
    "cancelled_bookings": 10,
    "total_revenue": 450000000,
    "monthly_growth": 15.5,
    "popular_tours": [...]
  }
}
```

#### **GET /api/agency/bookings/revenue**
**Purpose:** Thống kê doanh thu chi tiết  
**Authentication:** Agency  
**Query:** `?period=monthly&year=2025&month=7`
**Response:**
```json
{
  "success": true,
  "data": {
    "total_revenue": 450000000,
    "monthly_breakdown": [...],
    "tour_revenue": [...],
    "growth_rate": 15.5
  }
}
```

### **👥 Customer Management:**

#### **GET /api/agency/bookings/customers**
**Purpose:** Danh sách khách hàng đã đặt tour  
**Authentication:** Agency  
**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "user_id": "user-uuid",
        "name": "Nguyễn Văn A",
        "email": "a@example.com",
        "total_bookings": 3,
        "total_spent": 8700000,
        "last_booking_date": "2025-07-15",
        "favorite_destinations": ["Đà Lạt", "Nha Trang"]
      }
    ]
  }
}
```

#### **GET /api/agency/bookings/reviews**
**Purpose:** Reviews và đánh giá từ khách hàng  
**Authentication:** Agency  

### **📋 Booking Operations:**

#### **GET /api/agency/bookings**
**Purpose:** Danh sách bookings của agency  
**Authentication:** Agency  
**Query Parameters:**
```
?page=1&limit=10&status=confirmed&tour_id=xxx&date_from=2025-07-01&date_to=2025-07-31
```

#### **GET /api/agency/bookings/:id**
**Purpose:** Chi tiết booking cụ thể  
**Authentication:** Agency (chỉ booking của tour mình)  
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "booking-uuid",
    "user": {...},
    "tour": {...},
    "guests": [...],
    "payment": {...},
    "status": "confirmed",
    "total_price": 2900000,
    "booking_date": "2025-07-20",
    "departure_date": "2025-08-15"
  }
}
```

#### **PUT /api/agency/bookings/:id/status**
**Purpose:** Cập nhật trạng thái booking  
**Authentication:** Agency  
**Body:**
```json
{
  "status": "confirmed",
  "notes": "Booking confirmed by agency"
}
```

---

## 💰 **4. PAYMENT MANAGEMENT** - `/api/agency/payments`

### **📊 Payment Statistics:**

#### **GET /api/agency/payments/stats**
**Purpose:** Thống kê thanh toán tổng quan  
**Authentication:** Agency  
**Response:**
```json
{
  "success": true,
  "data": {
    "total_payments": 134,
    "successful_payments": 128,
    "failed_payments": 6,
    "total_amount": 371200000,
    "average_transaction": 2769400,
    "payment_methods": {
      "VNPay": 70,
      "MoMo": 58
    }
  }
}
```

#### **GET /api/agency/payments/revenue**
**Purpose:** Thống kê doanh thu từ payments  
**Authentication:** Agency  

#### **GET /api/agency/payments/commission**
**Purpose:** Thống kê hoa hồng nhận được  
**Authentication:** Agency  
**Response:**
```json
{
  "success": true,
  "data": {
    "total_commission": 37120000,
    "pending_commission": 2900000,
    "paid_commission": 34220000,
    "commission_rate": 10,
    "monthly_commission": [...]
  }
}
```

### **💳 Payment Operations:**

#### **GET /api/agency/payments**
**Purpose:** Danh sách payments của agency  
**Authentication:** Agency  
**Query Parameters:**
```
?page=1&limit=10&status=completed&method=VNPay&date_from=2025-07-01
```

#### **GET /api/agency/payments/:id**
**Purpose:** Chi tiết payment cụ thể  
**Authentication:** Agency  

#### **GET /api/agency/payments/monthly**
**Purpose:** Doanh thu theo tháng  
**Authentication:** Agency  
**Query:** `?year=2025&months=6,7,8`

#### **GET /api/agency/payments/export/csv**
**Purpose:** Export payment data ra CSV  
**Authentication:** Agency  
**Response:** CSV file download

---

## 🔧 **5. TECHNICAL INTEGRATION**

### **Error Handling:**
```javascript
// Standard error responses
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info"
}

// Common HTTP status codes:
200 - Success
201 - Created  
400 - Bad Request
401 - Unauthorized
403 - Forbidden (not approved agency)
404 - Not Found
500 - Server Error
```

### **Pagination Format:**
```javascript
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 156,
      "totalPages": 16,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### **Authentication Headers:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json
```

---

## 🎯 **6. BUSINESS WORKFLOW**

### **Agency Registration Flow:**
```
1. POST /api/agencies/public-request     # User đăng ký
2. GET /api/agencies (Admin)             # Admin xem danh sách
3. PUT /api/agencies/approve/:id         # Admin duyệt
4. Agency có thể access các endpoints khác
```

### **Tour Management Flow:**
```
1. POST /api/tours                       # Tạo tour
2. POST /api/departure-dates             # Thêm ngày khởi hành
3. Tour hiển thị public để user đặt
4. GET /api/agency/bookings              # Theo dõi bookings
5. PUT /api/agency/bookings/:id/status   # Quản lý bookings
```

### **Revenue Tracking Flow:**
```
1. GET /api/agency/payments/stats        # Overview
2. GET /api/agency/payments/revenue      # Chi tiết doanh thu
3. GET /api/agency/payments/commission   # Hoa hồng
4. GET /api/agency/payments/export/csv   # Export data
```

---

## 📊 **7. FRONTEND INTEGRATION EXAMPLES**

### **React/Vue.js Service Layer:**

```javascript
// Agency API Service
const agencyAPI = {
  // Authentication helper
  getHeaders() {
    return {
      'Authorization': `Bearer ${localStorage.getItem('agencyToken')}`,
      'Content-Type': 'application/json'
    };
  },

  // Dashboard Stats
  async getDashboardStats() {
    const [bookingStats, paymentStats, revenue] = await Promise.all([
      fetch('/api/agency/bookings/stats', { headers: this.getHeaders() }),
      fetch('/api/agency/payments/stats', { headers: this.getHeaders() }),
      fetch('/api/agency/payments/revenue', { headers: this.getHeaders() })
    ]);
    
    return {
      bookings: await bookingStats.json(),
      payments: await paymentStats.json(),
      revenue: await revenue.json()
    };
  },

  // Tour Management
  async getMyTours(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/tours/my-agency?${query}`, {
      headers: this.getHeaders()
    });
    return response.json();
  },

  async createTour(tourData) {
    const response = await fetch('/api/tours', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(tourData)
    });
    return response.json();
  },

  // Booking Management
  async getMyBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/agency/bookings?${query}`, {
      headers: this.getHeaders()
    });
    return response.json();
  },

  async updateBookingStatus(bookingId, status, notes) {
    const response = await fetch(`/api/agency/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, notes })
    });
    return response.json();
  },

  // Payment Management
  async getPaymentStats() {
    const response = await fetch('/api/agency/payments/stats', {
      headers: this.getHeaders()
    });
    return response.json();
  },

  async exportPayments() {
    const response = await fetch('/api/agency/payments/export/csv', {
      headers: this.getHeaders()
    });
    return response.blob(); // For file download
  }
};
```

### **Vue.js Component Example:**

```vue
<template>
  <div class="agency-dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <h3>📅 Total Bookings</h3>
        <p>{{ stats.bookings?.total_bookings || 0 }}</p>
      </div>
      <div class="stat-card">
        <h3>💰 Revenue</h3>
        <p>{{ formatCurrency(stats.revenue?.total_revenue || 0) }}</p>
      </div>
      <div class="stat-card">
        <h3>🎯 Success Rate</h3>
        <p>{{ successRate }}%</p>
      </div>
    </div>

    <div class="tables-section">
      <div class="recent-bookings">
        <h3>Recent Bookings</h3>
        <table>
          <tr v-for="booking in recentBookings" :key="booking.id">
            <td>{{ booking.tour.name }}</td>
            <td>{{ booking.user.name }}</td>
            <td>{{ formatCurrency(booking.total_price) }}</td>
            <td>
              <select @change="updateStatus(booking.id, $event.target.value)">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      stats: {},
      recentBookings: [],
      loading: false
    };
  },
  
  computed: {
    successRate() {
      if (!this.stats.payments) return 0;
      const total = this.stats.payments.total_payments;
      const successful = this.stats.payments.successful_payments;
      return total > 0 ? Math.round((successful / total) * 100) : 0;
    }
  },

  async mounted() {
    await this.loadDashboard();
  },

  methods: {
    async loadDashboard() {
      this.loading = true;
      try {
        this.stats = await agencyAPI.getDashboardStats();
        const bookingsResult = await agencyAPI.getMyBookings({ limit: 10 });
        this.recentBookings = bookingsResult.data.bookings || [];
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        this.loading = false;
      }
    },

    async updateStatus(bookingId, status) {
      try {
        await agencyAPI.updateBookingStatus(bookingId, status, '');
        await this.loadDashboard(); // Refresh data
        this.$toast.success('Booking status updated successfully');
      } catch (error) {
        this.$toast.error('Failed to update booking status');
      }
    },

    formatCurrency(amount) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    }
  }
};
</script>
```

---

## ✅ **8. PRODUCTION READY STATUS**

### **✅ Available & Working:**
- 🏢 **Agency Registration & Approval** - Complete workflow
- 🎯 **Tour Management** - Full CRUD với agency ownership
- 📅 **Booking Management** - Dashboard, stats, customer management
- 💰 **Payment Tracking** - Revenue, commission, export
- 📊 **Analytics** - Comprehensive statistics
- 🔐 **Security** - Role-based access, approval requirements

### **🎯 Business Value:**
- **Complete Agency Portal** - All tools needed to run tour business
- **Revenue Tracking** - Real-time revenue và commission monitoring
- **Customer Management** - Customer insights và relationship tracking
- **Operational Efficiency** - Streamlined booking và tour management

**Kết luận: Agency có đầy đủ 40+ endpoints để quản lý hoàn chỉnh business operations! 🎉**

---

## 🎫 **9. HỆ THỐNG MÃ GIẢM GIÁ (PROMOTION SYSTEM)**

### **🎯 Tổng quan:**
Hệ thống mã giảm giá cho phép **User** và **Guest** sử dụng mã khuyến mãi để giảm giá khi đặt tour.

---

### **📊 CÁCH HOẠT ĐỘNG:**

#### **🏷️ Promotion Model:**
```javascript
Promotion {
  id: UUID,
  code: STRING (Unique),           // Mã giảm giá (VD: "SUMMER2025")
  description: TEXT,               // Mô tả khuyến mãi
  discount_amount: DECIMAL(12,2),  // Số tiền giảm (VNĐ hoặc %)
  start_date: DATE,                // Ngày bắt đầu
  end_date: DATE                   // Ngày kết thúc
}
```

#### **💡 Logic tính giảm giá:**
```javascript
// Nếu discount_amount > 100 → Giảm giá cố định (VNĐ)
if (discount_amount > 100) {
  discount = Math.min(discount_amount, tour_price); // Không vượt quá giá gốc
}

// Nếu discount_amount ≤ 100 → Giảm giá theo phần trăm (%)
else {
  discount = (tour_price * discount_amount) / 100;
}

final_price = Math.max(0, tour_price - discount);
```

---

### **🔧 API ENDPOINTS:**

#### **📋 Quản lý Promotions (Admin):**
```http
GET    /api/promotions              # Danh sách tất cả promotions
GET    /api/promotions/active       # Promotions đang hoạt động
GET    /api/promotions/code/:code   # Lấy promotion theo mã
GET    /api/promotions/:id          # Chi tiết promotion
POST   /api/promotions              # Tạo promotion mới
PUT    /api/promotions/:id          # Cập nhật promotion
DELETE /api/promotions/:id          # Xóa promotion
```

#### **✅ Validate Promotion (Public):**
```http
POST   /api/bookings/validate-promotion     # User validate mã
POST   /api/guest/validate-promotion        # Guest validate mã
```

---

### **🎯 SỬ DỤNG MÃ GIẢM GIÁ:**

#### **1. User (Đã đăng nhập) - Validate:**
```javascript
// Request
POST /api/bookings/validate-promotion
{
  "promotion_code": "SUMMER2025",
  "tour_price": 2900000
}

// Response Success
{
  "valid": true,
  "promotion": {
    "id": "promotion-uuid",
    "code": "SUMMER2025",
    "description": "Giảm giá mùa hè 500k",
    "discount_amount": 500000
  },
  "pricing": {
    "original_price": 2900000,
    "discount_amount": 500000,
    "final_price": 2400000,
    "savings": 500000
  }
}
```

#### **2. Guest (Khách vãng lai) - Validate:**
```javascript
// Request
POST /api/guest/validate-promotion
{
  "promotion_code": "JULY20",
  "tour_price": 1500000
}

// Response Success
{
  "success": true,
  "message": "Mã khuyến mãi hợp lệ",
  "data": {
    "promotion": {
      "id": "promotion-uuid",
      "code": "JULY20",
      "description": "Giảm 20% tháng 7",
      "discount_amount": 20
    },
    "pricing": {
      "original_price": 1500000,
      "discount_amount": 300000,  // 20% của 1.5M
      "final_price": 1200000,
      "savings": 300000
    }
  }
}
```

#### **3. Áp dụng khi đặt tour:**
```javascript
// User Booking với promotion
POST /api/bookings
{
  "tour_id": "tour-uuid",
  "departure_date_id": "departure-uuid",
  "promotion_id": "promotion-uuid",    // ID của promotion đã validate
  "number_of_adults": 2,
  "number_of_children": 0,
  "guests": [...],
  // original_price và discount_amount sẽ được tính tự động
}

// Guest Booking với promotion
POST /api/guest/bookings
{
  "tour_id": "tour-uuid",
  "departure_date_id": "departure-uuid", 
  "promotion_code": "SUMMER2025",      // Dùng code thay vì ID
  "number_of_adults": 2,
  "guests": [...],
  "guest_info": {
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "phone": "0123456789"
  }
}
```

---

### **⚠️ VALIDATION RULES:**

#### **📅 Kiểm tra thời gian:**
```javascript
const now = new Date();

// Chưa có hiệu lực
if (now < promotion.start_date) {
  return "Mã khuyến mãi chưa có hiệu lực";
}

// Đã hết hạn  
if (now > promotion.end_date) {
  return "Mã khuyến mãi đã hết hạn";
}
```

#### **🔍 Kiểm tra tồn tại:**
```javascript
// Chuẩn hóa mã code
const normalizedCode = promotion_code.trim().toUpperCase();

const promotion = await Promotion.findOne({
  where: { code: normalizedCode }
});

if (!promotion) {
  return "Mã khuyến mãi không tồn tại";
}
```

---

### **🎨 Frontend Integration:**

#### **Vue.js Component Example:**
```vue
<template>
  <div class="promotion-section">
    <div class="promo-input">
      <input 
        v-model="promoCode" 
        placeholder="Nhập mã giảm giá"
        @blur="validatePromotion"
      />
      <button @click="validatePromotion" :disabled="loading">
        {{ loading ? 'Đang kiểm tra...' : 'Áp dụng' }}
      </button>
    </div>

    <div v-if="promotion" class="promo-success">
      <h4>✅ {{ promotion.description }}</h4>
      <p>Giá gốc: {{ formatCurrency(pricing.original_price) }}</p>
      <p>Giảm giá: -{{ formatCurrency(pricing.discount_amount) }}</p>
      <p class="final-price">
        <strong>Thành tiền: {{ formatCurrency(pricing.final_price) }}</strong>
      </p>
    </div>

    <div v-if="error" class="promo-error">
      ❌ {{ error }}
    </div>
  </div>
</template>

<script>
export default {
  props: ['tourPrice', 'isGuest'],
  
  data() {
    return {
      promoCode: '',
      promotion: null,
      pricing: null,
      error: null,
      loading: false
    };
  },

  methods: {
    async validatePromotion() {
      if (!this.promoCode.trim()) return;
      
      this.loading = true;
      this.error = null;
      
      try {
        const endpoint = this.isGuest 
          ? '/api/guest/validate-promotion'
          : '/api/bookings/validate-promotion';
          
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.isGuest ? {} : { 'Authorization': `Bearer ${this.token}` })
          },
          body: JSON.stringify({
            promotion_code: this.promoCode,
            tour_price: this.tourPrice
          })
        });

        const result = await response.json();

        if (response.ok) {
          if (this.isGuest) {
            this.promotion = result.data.promotion;
            this.pricing = result.data.pricing;
          } else {
            this.promotion = result.promotion;
            this.pricing = result.pricing;
          }
          
          // Emit event để parent component sử dụng
          this.$emit('promotion-applied', {
            promotion: this.promotion,
            pricing: this.pricing
          });
        } else {
          this.error = result.message || result.error || 'Mã không hợp lệ';
          this.promotion = null;
          this.pricing = null;
        }
      } catch (error) {
        this.error = 'Lỗi kết nối, vui lòng thử lại';
        console.error('Promotion validation error:', error);
      } finally {
        this.loading = false;
      }
    },

    formatCurrency(amount) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    },

    clearPromotion() {
      this.promoCode = '';
      this.promotion = null;
      this.pricing = null;
      this.error = null;
      this.$emit('promotion-cleared');
    }
  }
};
</script>

<style scoped>
.promo-input {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.promo-success {
  background: #e8f5e8;
  padding: 15px;
  border-radius: 5px;
  border-left: 4px solid #4caf50;
}

.promo-error {
  background: #ffeaea;
  padding: 10px;
  border-radius: 5px;
  border-left: 4px solid #f44336;
  color: #d32f2f;
}

.final-price {
  font-size: 1.2em;
  color: #4caf50;
}
</style>
```

#### **React Hook Example:**
```javascript
import { useState } from 'react';

const usePromotion = (tourPrice, isGuest = false) => {
  const [promoCode, setPromoCode] = useState('');
  const [promotion, setPromotion] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const validatePromotion = async () => {
    if (!promoCode.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = isGuest 
        ? '/api/guest/validate-promotion'
        : '/api/bookings/validate-promotion';
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isGuest ? {} : { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        },
        body: JSON.stringify({
          promotion_code: promoCode,
          tour_price: tourPrice
        })
      });

      const result = await response.json();

      if (response.ok) {
        if (isGuest) {
          setPromotion(result.data.promotion);
          setPricing(result.data.pricing);
        } else {
          setPromotion(result.promotion);
          setPricing(result.pricing);
        }
      } else {
        setError(result.message || result.error || 'Mã không hợp lệ');
        setPromotion(null);
        setPricing(null);
      }
    } catch (error) {
      setError('Lỗi kết nối, vui lòng thử lại');
      console.error('Promotion validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearPromotion = () => {
    setPromoCode('');
    setPromotion(null);
    setPricing(null);
    setError(null);
  };

  return {
    promoCode,
    setPromoCode,
    promotion,
    pricing,
    error,
    loading,
    validatePromotion,
    clearPromotion
  };
};

export default usePromotion;
```

---

### **📈 Business Logic:**

#### **💰 Pricing trong Booking:**
```javascript
// Booking record sẽ lưu:
{
  promotion_id: "promotion-uuid",        // Liên kết với promotion
  original_price: 2900000,              // Giá gốc (tour.price * số người)
  discount_amount: 500000,              // Số tiền được giảm
  total_price: 2400000                  // Giá cuối cùng (original_price - discount_amount)
}
```

#### **📊 Tours với Promotions:**
```javascript
// API lấy tours có promotion đang hoạt động
GET /api/tours/with-promotions

// Response
[
  {
    "id": "tour-uuid",
    "name": "Tour Đà Lạt Mộng Mơ",
    "price": 2900000,
    "promotion": {
      "id": "promotion-uuid",
      "code": "SUMMER2025",
      "description": "Giảm 500k tour Đà Lạt",
      "discount_amount": 500000
    },
    "discounted_price": 2400000  // Giá sau khi áp dụng promotion
  }
]
```

---

### **✅ TÍNH NĂNG ĐÃ HOÀN THIỆN:**

- ✅ **Model & Database** - Promotion table với đầy đủ fields
- ✅ **Validation API** - Cho cả User và Guest  
- ✅ **Booking Integration** - Hỗ trợ promotion trong booking flow
- ✅ **Business Logic** - Tính giảm giá linh hoạt (VNĐ hoặc %)
- ✅ **Time Validation** - Kiểm tra thời gian hiệu lực
- ✅ **Error Handling** - Xử lý lỗi đầy đủ
- ✅ **Frontend Ready** - API sẵn sàng integrate

**🎉 Hệ thống mã giảm giá đã hoàn thiện và sẵn sàng sử dụng!**
