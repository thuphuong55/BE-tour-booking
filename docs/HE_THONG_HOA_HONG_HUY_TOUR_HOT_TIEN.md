# 🎯 MÔ TẢ HỆ THỐNG QUẢN LÝ HOA HỒNG, HỦY TOUR & HOÀN TIỀN

## 📊 **TỔNG QUAN HỆ THỐNG**

Hệ thống backend tour booking này có **3 module chính** hoạt động độc lập và liên kết chặt chẽ:

### 🔄 **Luồng hoạt động tổng thể:**
```
Booking Confirmed → Tính Hoa Hồng → Hủy Tour (nếu có) → Hoàn Tiền & Thu Hồi Hoa Hồng
```

---

## 💰 **1. HỆ THỐNG QUẢN LÝ HOA HỒNG (Commission System)**

### **🎯 Mục đích:**
- Tính toán và phân chia hoa hồng giữa **Admin** và **Agency** từ mỗi booking thành công
- Quản lý tỷ lệ hoa hồng linh hoạt theo agency, category tour, và giá trị booking
- Theo dõi và báo cáo doanh thu chi tiết

### **📊 Công thức tính hoa hồng:**
```javascript
Hoa hồng Admin = Tổng giá trị tour × Tỷ lệ % hoa hồng
Số tiền Agency = Tổng giá trị tour - Hoa hồng Admin
```

**Ví dụ thực tế:**
- **Tour Đà Lạt**: 2,000,000 VNĐ
- **Tỷ lệ hoa hồng**: 15%
- **Hoa hồng Admin**: 2,000,000 × 15% = 300,000 VNĐ
- **Agency nhận**: 2,000,000 - 300,000 = 1,700,000 VNĐ

### **⚙️ Cơ chế hoạt động:**

#### **A. Tự động tính hoa hồng khi booking confirmed:**
```javascript
// Khi booking status chuyển thành 'confirmed'
if (booking.status === 'confirmed' && !booking.commission_calculated_at) {
  await CommissionService.calculateCommission(booking.id);
}
```

#### **B. Database Schema:**
```sql
-- Bảng booking (đã thêm các trường commission)
ALTER TABLE booking 
ADD COLUMN commission_rate DECIMAL(5,2) NULL COMMENT 'Tỷ lệ hoa hồng (%)',
ADD COLUMN admin_commission DECIMAL(12,2) NULL COMMENT 'Hoa hồng admin',
ADD COLUMN agency_amount DECIMAL(12,2) NULL COMMENT 'Số tiền agency nhận',
ADD COLUMN commission_calculated_at DATETIME NULL COMMENT 'Thời điểm tính hoa hồng';
```

#### **C. Logic tính tỷ lệ hoa hồng (ưu tiên):**
1. **Tour category cụ thể**: Cấu hình có `tour_category_id` 
2. **Giá trị booking**: Theo `min_booking_value`/`max_booking_value`
3. **Agency cụ thể**: Cấu hình riêng cho agency VIP
4. **Mặc định**: 15% nếu không tìm thấy cấu hình

### **🔧 API Endpoints:**

#### **Tính hoa hồng:**
```http
POST /api/admin/commissions/calculate/:bookingId    # Tính cho 1 booking
POST /api/admin/commissions/calculate-pending       # Tính hàng loạt pending
```

#### **Quản lý cấu hình:**
```http
GET    /api/admin/commissions/settings       # Xem cấu hình
POST   /api/admin/commissions/settings       # Tạo cấu hình mới
PUT    /api/admin/commissions/settings/:id   # Cập nhật
DELETE /api/admin/commissions/settings/:id   # Xóa
```

#### **Báo cáo & Dashboard:**
```http
GET /api/admin/commissions/report                  # Báo cáo chi tiết
GET /api/dashboard/commissions/admin/overview      # Tổng quan Admin
GET /api/dashboard/commissions/admin/pending       # Booking chưa tính hoa hồng
GET /api/dashboard/commissions/agency/stats        # Thống kê Agency
```

### **📱 Dashboard Features:**

#### **Admin Dashboard:**
- **Tổng quan doanh thu** theo period (tuần/tháng/quý/năm)
- **Top agencies** với doanh thu cao nhất
- **Bookings chưa tính hoa hồng** (pending commissions)
- **Biểu đồ xu hướng** hoa hồng theo thời gian

#### **Agency Dashboard:**
- **Thu nhập agency** và số booking
- **Tỷ lệ hoa hồng** hiện tại
- **Top tours** đóng góp doanh thu
- **Lịch sử hoa hồng** chi tiết

---

## ❌ **2. HỆ THỐNG HỦY TOUR (Booking Cancellation)**

### **🎯 Mục đích:**
- Xử lý yêu cầu hủy tour từ User, Agency, hoặc Admin
- Tính toán mức hoàn tiền dựa trên thời gian và điều kiện
- Thu hồi hoa hồng đã tính khi hủy booking

### **⏰ Quy tắc hoàn tiền theo thời gian:**

| **Thời điểm hủy** | **Mức hoàn tiền** | **Điều kiện** |
|---|---|---|
| **Trong 24h sau thanh toán** + **≥15 ngày trước khởi hành** | **100%** | Không áp dụng phí |
| **≥30 ngày trước khởi hành** | **100%** | Trừ phí không hoàn lại |
| **15-29 ngày trước khởi hành** | **70%** | Trừ phí không hoàn lại |
| **7-14 ngày trước khởi hành** | **50%** | Trừ phí không hoàn lại |
| **<7 ngày trước khởi hành** | **0%** | Không hoàn tiền |
| **Đã khởi hành** | **0%** | Không được hủy |
| **Force Majeure** (thiên tai, dịch bệnh) | **100%** | Đặc biệt |
| **No Show** (không đến) | **0%** | Không hoàn |

### **💸 Phí không hoàn lại:**
```javascript
function calculateNonRefundableFees(booking) {
  return (booking.visaFee || 0) + 
         (booking.depositFee || 0) + 
         (booking.paymentFee || 0) + 
         (booking.ticketFee || 0);
}
```

### **🔐 Phân quyền hủy tour:**
- **User**: Chỉ được hủy booking của chính mình
- **Agency**: Hủy booking của tours thuộc agency
- **Admin**: Hủy bất kỳ booking nào

### **⚙️ Cơ chế hoạt động:**

#### **A. API Endpoint:**
```http
POST /api/bookings/:id/cancel
```

#### **B. Request Body:**
```json
{
  "reason": "Lý do hủy tour (tùy chọn)"
}
```

#### **C. Luồng xử lý:**
```javascript
1. Kiểm tra quyền hủy (user/agency/admin)
2. Validate trạng thái booking (chưa hủy, chưa khởi hành)
3. Tính mức hoàn tiền theo quy tắc
4. Thu hồi hoặc hủy hoa hồng đã tính
5. Cập nhật status booking = 'cancelled'
6. Tạo Refund record cho hoàn tiền
7. Gửi thông báo cho các bên liên quan
```

#### **D. Xử lý hoa hồng khi hủy:**
```javascript
// Nếu hoa hồng đã được trả → Tạo reversal record
await Commission.create({
  bookingId,
  agencyId: commission.agencyId,
  amount: -commission.amount,        // Số âm = thu hồi
  status: 'reversal',
  note: 'Thu hồi hoa hồng do hủy tour'
});

// Nếu hoa hồng chưa trả → Hủy commission
commission.status = 'cancelled';
commission.note = 'Hủy hoa hồng do hủy tour';
```

### **📊 Response sau khi hủy:**
```json
{
  "message": "Yêu cầu hủy tour đã được ghi nhận",
  "refundAmount": 1400000,
  "refundRate": 0.7,
  "nonRefundableFees": 100000
}
```

---

## 💵 **3. HỆ THỐNG HOÀN TIỀN (Refund System)**

### **🎯 Mục đích:**
- Quản lý và theo dõi các yêu cầu hoàn tiền
- Xử lý hoàn tiền qua các gateway thanh toán
- Audit trail đầy đủ cho việc hoàn tiền

### **📊 Refund Model:**
```javascript
Refund {
  id: UUID,
  bookingId: UUID,           // Liên kết với booking bị hủy
  userId: UUID,              // User yêu cầu hoàn tiền
  amount: DECIMAL(12,2),     // Số tiền hoàn
  status: ENUM,              // 'pending', 'processing', 'completed', 'failed'
  reason: TEXT,              // Lý do hoàn tiền
  paymentMethod: STRING,     // VNPay, MoMo, Bank Transfer
  refundDate: DATE,          // Ngày hoàn tiền thành công
  createdAt: DATE,
  updatedAt: DATE
}
```

### **🔄 Trạng thái hoàn tiền:**
```
pending → processing → completed
                   ↘ failed → pending (retry)
```

### **⚙️ API Endpoints:**

#### **Quản lý hoàn tiền:**
```http
GET    /api/admin/refunds              # Danh sách yêu cầu hoàn tiền
GET    /api/refunds/:id                # Chi tiết hoàn tiền
PUT    /api/admin/refunds/:id/process  # Xử lý hoàn tiền
PUT    /api/admin/refunds/:id/complete # Hoàn thành hoàn tiền
```

#### **Tích hợp Payment Gateway:**
```http
POST /api/refunds/vnpay/:refundId      # Hoàn tiền qua VNPay
POST /api/refunds/momo/:refundId       # Hoàn tiền qua MoMo
```

### **💳 Luồng hoàn tiền:**
```javascript
1. Booking bị hủy → Tạo Refund record (status: 'pending')
2. Admin/System xử lý → Update status: 'processing'
3. Call Payment Gateway API → Thực hiện hoàn tiền
4. Nhận callback từ Gateway → Update status: 'completed'/'failed'
5. Gửi email thông báo → User nhận tiền
```

---

## 🔄 **4. LUỒNG TÍCH HỢP TỔNG THỂ**

### **📋 Kịch bản 1: Booking thành công**
```
1. User tạo booking → status: 'pending'
2. User thanh toán → status: 'confirmed'
3. System tự động tính hoa hồng
4. Admin dashboard hiển thị commission
5. Agency dashboard hiển thị earning
```

### **📋 Kịch bản 2: Hủy tour sau khi confirmed**
```
1. User/Agency yêu cầu hủy booking
2. System tính mức hoàn tiền theo quy tắc
3. Thu hồi hoa hồng đã tính (nếu có)
4. Tạo Refund record
5. Admin xử lý hoàn tiền
6. Update dashboard statistics
```

### **📋 Kịch bản 3: Booking hết hạn**
```
1. Booking tạo với status: 'pending'
2. Sau 15 phút không thanh toán
3. Cron job update status: 'expired'
4. Không tính hoa hồng
5. Không cần hoàn tiền
```

---

## 🛠️ **5. AUTOMATION & BACKGROUND JOBS**

### **⏰ Expire Bookings Job:**
```javascript
// Chạy mỗi 15 phút
// File: jobs/expireBookings.js
- Tìm booking status 'pending' > 15 phút
- Update status thành 'expired'
- Giải phóng departure date slots
```

### **💰 Commission Calculation Job:**
```javascript
// Trigger manual hoặc scheduled
- Tìm confirmed bookings chưa tính hoa hồng
- Batch calculate commissions
- Update booking records
- Generate reports
```

### **📧 Notification System:**
```javascript
// Gửi email khi:
- Booking confirmed → Thông báo cho agency về hoa hồng
- Tour bị hủy → Thông báo cho user về hoàn tiền
- Commission reversal → Thông báo cho agency
```

---

## 📊 **6. DASHBOARD & REPORTING**

### **Admin Dashboard Features:**
- **📈 Tổng quan doanh thu**: Bookings, Revenue, Commission theo period
- **🏆 Top Agencies**: Xếp hạng theo doanh thu
- **⏳ Pending Actions**: Bookings chưa tính hoa hồng, Refunds cần xử lý
- **📊 Charts**: Xu hướng commission theo thời gian
- **📋 Reports**: Export Excel/PDF chi tiết

### **Agency Dashboard Features:**
- **💰 Thu nhập**: Total earnings, Commission rate hiện tại
- **📊 Performance**: Số booking, Average booking value
- **🎯 Top Tours**: Tours đóng góp doanh thu cao nhất
- **📅 History**: Lịch sử hoa hồng chi tiết theo thời gian

---

## ⚠️ **7. VẤN ĐỀ & GIẢI PHÁP**

### **✅ Đã hoạt động:**
- ✅ Tính hoa hồng tự động khi booking confirmed
- ✅ Cấu hình tỷ lệ hoa hồng linh hoạt
- ✅ Dashboard commission cho Admin & Agency
- ✅ Quy tắc hủy tour và tính hoàn tiền
- ✅ Thu hồi hoa hồng khi hủy booking
- ✅ Background job expire bookings

### **🔧 Cần cải thiện:**
- 🚧 **Refund Model**: Chưa có model Refund trong database
- 🚧 **Payment Gateway Integration**: Chưa tích hợp hoàn tiền VNPay/MoMo
- 🚧 **Email Notifications**: Chưa gửi thông báo tự động
- 🚧 **Audit Trail**: Chưa log đầy đủ các thao tác
- 🚧 **Report Export**: Chưa có chức năng xuất Excel/PDF

### **📋 TODO List:**
1. **Tạo Refund Model** và migration
2. **Tích hợp Payment Gateway** cho hoàn tiền
3. **Email Service** cho notifications
4. **Audit Log System** cho tracking
5. **Export functionality** cho reports
6. **Commission dispute system** cho khiếu nại

---

## 🎯 **8. KẾT LUẬN**

Hệ thống hiện tại đã có **kiến trúc vững chắc** với các tính năng cốt lõi:

### **💪 Điểm mạnh:**
- **Tự động hóa**: Tính hoa hồng tự động, expire bookings
- **Linh hoạt**: Cấu hình tỷ lệ commission đa dạng
- **Minh bạch**: Dashboard và báo cáo chi tiết
- **Bảo mật**: Phân quyền rõ ràng cho từng role
- **Audit**: Theo dõi đầy đủ commission history

### **🚀 Tiềm năng mở rộng:**
- Tích hợp AI để dự đoán xu hướng commission
- Real-time notifications qua WebSocket
- Mobile app cho agency management
- Advanced analytics và business intelligence
- Multi-currency support cho tour quốc tế

Hệ thống đã sẵn sàng để **scale up** và **integrate** với các dịch vụ bên ngoài!
