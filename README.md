# 🌍 BE Tour Booking System

Backend cho hệ thống đặt tour du lịch, được xây dựng với Node.js, Express và PostgreSQL.

## 🚀 Cấu trúc dự án

```
BE-tour-booking/
├── 📁 config/          # Cấu hình database và ứng dụng
├── 📁 controllers/     # Xử lý logic nghiệp vụ
├── 📁 data/           # Dữ liệu tĩnh (provinces, etc.)
├── 📁 docs/           # 📚 Tài liệu API và hướng dẫn
├── 📁 jobs/           # Background jobs và scheduled tasks
├── 📁 middlewares/    # Middleware xác thực và bảo mật
├── 📁 migrations/     # Database migrations
├── 📁 models/         # Models Sequelize
├── 📁 routes/         # API routes định nghĩa
├── 📁 services/       # Services và business logic
├── 📁 utils/          # Utilities và helper functions
├── app.js             # Cấu hình Express app
├── server.js          # Entry point của ứng dụng
├── sync.js            # Database sync utility
└── package.json       # Dependencies và scripts
```

## 🔧 Cài đặt và chạy

1. **Clone repository:**
   ```bash
   git clone https://github.com/DilysNT/BE-Tour.git
   cd BE-Tour
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Cấu hình môi trường:**
   - Copy `.env.example` thành `.env`
   - Cập nhật thông tin database và các config cần thiết

4. **Đồng bộ database:**
   ```bash
   node sync.js
   ```

5. **Chạy ứng dụng:**
   ```bash
   npm start
   # hoặc development mode
   npm run dev
   ```

## 📚 Tài liệu

Tất cả tài liệu API và hướng dẫn được lưu trong thư mục [`docs/`](./docs/):

- 📖 [API Documentation](./docs/) - Tài liệu API chi tiết
- 🔍 [System Analysis](./docs/BACKEND_SYSTEM_ANALYSIS.md) - Phân tích hệ thống
- 🎯 [Tour Flow Analysis](./docs/TOUR_FLOW_ANALYSIS.md) - Phân tích flow tour
- 🎨 [Frontend Guide](./docs/FRONTEND_TOUR_GUIDE.md) - Hướng dẫn frontend

## 🛠️ Công nghệ sử dụng

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL với Sequelize ORM
- **Authentication**: JWT
- **Email**: Nodemailer
- **Payment**: MoMo API integration
- **File Upload**: Multer

## 🌟 Tính năng chính

- ✅ Hệ thống xác thực và phân quyền (User, Agency, Admin)
- ✅ Quản lý tour du lịch
- ✅ Hệ thống booking và thanh toán
- ✅ Hệ thống hoa hồng cho agency
- ✅ API tìm kiếm và lọc tour
- ✅ Quản lý đánh giá và review
- ✅ Dashboard thống kê
- ✅ Email notifications

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/forgot-password` - Quên mật khẩu

### Tours
- `GET /api/tours` - Lấy danh sách tour
- `POST /api/tours` - Tạo tour mới (Agency)
- `GET /api/tours/:id` - Chi tiết tour

### Booking
- `POST /api/bookings` - Tạo booking
- `GET /api/bookings/:id` - Chi tiết booking

### Payment
- `POST /api/momo/create-payment` - Tạo thanh toán MoMo
- `GET /api/payments/:id` - Chi tiết thanh toán

*Xem thêm tài liệu API chi tiết trong thư mục [`docs/`](./docs/)*

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License.

## 📞 Liên hệ

- **Developer**: DilysNT
- **Email**: dh52106342@student.stu.edu.vn
- **Repository**: [https://github.com/DilysNT/BE-Tour](https://github.com/DilysNT/BE-Tour)
