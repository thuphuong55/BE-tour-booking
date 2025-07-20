# 🔐 **FORGOT PASSWORD API - OTP Flow**

## **📋 Overview**
Hệ thống quên mật khẩu sử dụng OTP (One-Time Password) gửi qua email để đảm bảo bảo mật cao### **🧪 Test Results - HOÀN THÀNH:**
```
🧪 Create Test User and Test Forgot Password...
✅ Test user created successfully
1️⃣ Test POST /api/auth/forgot-password
✅ Forgot Password Success with debug OTP: 922570
2️⃣ Test POST /api/auth/verify-otp  
✅ Verify OTP Success with reset token
3️⃣ Test POST /api/auth/reset-password-with-token
✅ Reset Password Success
4️⃣ Test login with new password
✅ Login with new password Success
🎉 Complete Forgot Password Flow Test finished!
```

### **🎯 Features Hoàn thành:**

### **🔄 Flow tổng quan:**
```
1. User nhập email → 2. Hệ thống gửi OTP → 3. User nhập OTP → 4. Xác thực thành công → 5. Đặt mật khẩu mới
```

---

## **1. Yêu cầu OTP**
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### **Response Success:**
```json
{
  "message": "OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
  "debug": {
    "otp": "123456"  // Chỉ hiển thị trong development mode
  }
}
```

### **Response (Email không tồn tại):**
```json
{
  "message": "Nếu email tồn tại, OTP đã được gửi. Vui lòng kiểm tra hộp thư."
}
```

### **Behavior:**
- Tạo OTP 6 số ngẫu nhiên
- OTP có hiệu lực **15 phút**
- Gửi email HTML đẹp chứa OTP
- Không tiết lộ email có tồn tại hay không (security)
- Áp dụng cho cả **User** và **Agency**

### **Email Template:**
```html
<h2>Đặt lại mật khẩu</h2>
<p>Chào <strong>{name}</strong>,</p>
<p>Mã OTP của bạn là:</p>
<h1 style="color: #007bff; font-size: 32px;">{OTP}</h1>
<p><strong>Hiệu lực: 15 phút</strong></p>
```

---

## **2. Xác thực OTP**
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

### **Response Success:**
```json
{
  "message": "OTP hợp lệ. Bạn có thể đặt mật khẩu mới.",
  "resetToken": "abc123def456...789"
}
```

### **Response Errors:**
```json
// OTP sai
{
  "message": "OTP không chính xác"
}

// OTP hết hạn
{
  "message": "OTP đã hết hạn. Vui lòng yêu cầu OTP mới."
}

// Email không tồn tại
{
  "message": "Email không tồn tại"
}
```

### **Behavior:**
- Kiểm tra OTP có chính xác không
- Kiểm tra OTP có hết hạn không (15 phút)
- Tạo `resetToken` tạm thời để đặt password
- Xóa OTP khỏi database sau khi xác thực thành công
- Chỉ sử dụng được **1 lần**

---

## **3. Đặt mật khẩu mới**
```http
POST /api/auth/reset-password-with-token
Content-Type: application/json

{
  "resetToken": "abc123def456...789",
  "password": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

### **Response Success:**
```json
{
  "message": "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới."
}
```

### **Response Errors:**
```json
// Thiếu thông tin
{
  "message": "Vui lòng cung cấp đầy đủ thông tin"
}

// Mật khẩu không khớp
{
  "message": "Mật khẩu xác nhận không khớp"
}

// Mật khẩu quá ngắn
{
  "message": "Mật khẩu phải có ít nhất 6 ký tự"
}

// Token không hợp lệ
{
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

### **Behavior:**
- Kiểm tra `resetToken` có hợp lệ không
- Validate mật khẩu mới (≥6 ký tự)
- Hash password với bcrypt
- Xóa `resetToken` sau khi thành công
- Gửi email thông báo đổi password thành công

---

## **🔒 Security Features**

### **OTP Security:**
- **6 chữ số** ngẫu nhiên (100,000 - 999,999)
- **Thời hạn 15 phút** - tự động hết hiệu lực
- **Một lần sử dụng** - xóa sau khi verify thành công
- **Không tiết lộ email** - response giống nhau dù email có tồn tại hay không

### **Token Security:**
- **Reset token** được tạo bằng crypto.randomBytes(32)
- **Một lần sử dụng** - xóa sau khi đặt password thành công
- **Không có thời hạn** - nhưng chỉ tạo sau khi verify OTP

### **Database Fields:**
```sql
forgot_password_otp VARCHAR(255) NULL
forgot_password_otp_expires DATETIME NULL
temp_password_token VARCHAR(255) NULL  -- Dùng cho reset token
```

---

## **📧 Email Notifications**

### **OTP Email:**
- **Subject:** "Mã OTP đặt lại mật khẩu"
- **Content:** OTP 6 số in đậm, thời hạn 15 phút
- **Design:** HTML responsive, professional

### **Success Email:**
- **Subject:** "Mật khẩu đã được đặt lại thành công"
- **Content:** Thông báo thành công + thời gian thay đổi
- **Security note:** Cảnh báo nếu không phải user thực hiện

---

## **🧪 Testing Flow**

### **Complete Test Scenario:**
```javascript
// 1. Request OTP
POST /api/auth/forgot-password
{ "email": "user@example.com" }

// 2. Check email và lấy OTP
// Trong development: OTP trả về trong response.debug.otp

// 3. Verify OTP  
POST /api/auth/verify-otp
{ "email": "user@example.com", "otp": "123456" }
// Response: { resetToken: "..." }

// 4. Reset password
POST /api/auth/reset-password-with-token
{ 
  "resetToken": "...", 
  "password": "newPass123",
  "confirmPassword": "newPass123"
}

// 5. Test login với password mới
POST /api/auth/login
{ "email": "user@example.com", "password": "newPass123" }
```

---

## **⚠️ Error Handling**

### **Common Errors:**
- **400**: Bad request (thiếu data, validation fail)
- **500**: Server error (email service down, database error)

### **Edge Cases được handle:**
- Email không tồn tại ✅
- OTP đã hết hạn ✅  
- OTP sai ✅
- Token không hợp lệ ✅
- Mật khẩu validation ✅
- Email service failure ✅

---

## **🌍 Multi-language Support**

### **Vietnamese Messages:**
- "OTP đã được gửi đến email của bạn"
- "OTP không chính xác"  
- "OTP đã hết hạn"
- "Đặt lại mật khẩu thành công"

### **Future Enhancement:**
- Có thể dễ dàng thêm multi-language
- Template email theo ngôn ngữ
- Error messages localization

---

## **📱 Frontend Integration**

### **Step-by-step UI Flow:**
```javascript
// Step 1: Forgot Password Form
const forgotPassword = async (email) => {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  // Show: "OTP đã được gửi đến email"
};

// Step 2: OTP Verification Form  
const verifyOTP = async (email, otp) => {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  const { resetToken } = await response.json();
  return resetToken;
};

// Step 3: New Password Form
const resetPassword = async (resetToken, password, confirmPassword) => {
  const response = await fetch('/api/auth/reset-password-with-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resetToken, password, confirmPassword })
  });
  // Redirect to login page
};
```

---

## **🚀 Usage for Different User Types**

### **Regular Users:**
- Đăng ký bình thường → Quên password → OTP flow

### **Agency Users:**
- Được admin duyệt → Nhận email set password → Sau đó có thể dùng forgot password

### **Admin Users:**  
- Tạo bởi system → Có thể dùng forgot password để reset

**Tất cả đều dùng chung flow OTP này! 🎯**
