// Lấy agency theo user_id
exports.getAgencyByUserId = async (req, res) => {
  try {
    const db = require('../config/db');
    const dbSequelize = db.sequelize || db;
    // Liệt kê tất cả user_id trong bảng agency để debug
    const [allUserIds] = await dbSequelize.query('SELECT user_id FROM agency');
    console.log('Tất cả user_id trong bảng agency:', allUserIds.map(u => u.user_id));
    const { userId } = req.params;
    const { Op } = require('sequelize');
    console.log('userId param:', userId, typeof userId);
    // So sánh từng user_id trong bảng với userId param
    allUserIds.forEach(u => {
      console.log(`[DEBUG] So sánh userId param (${userId}) === user_id trong bảng (${u.user_id}):`, userId === u.user_id, '| typeof:', typeof u.user_id);
    });
    // Sequelize query
    const agency = await Agency.findOne({ where: { user_id: { [Op.eq]: String(userId) } } });
    console.log('agency found (Sequelize):', agency);

    // Raw SQL query
    const [results, metadata] = await dbSequelize.query('SELECT * FROM agency WHERE user_id = ?', { replacements: [userId] });
    console.log('agency found (RAW SQL):', results);

    const [rows] = await dbSequelize.query('SELECT DATABASE() as db');
    console.log('Current DB:', rows[0].db);

    if (!agency && (!results || results.length === 0)) {
      console.log('[DEBUG] Không tìm thấy agency với user_id này:', userId);
      return res.status(404).json({ message: 'Không tìm thấy agency với user_id này' });
    }
    res.json({
      agencySequelize: agency,
      agencyRaw: results
    });
  } catch (err) {
    console.error('[DEBUG] Lỗi server khi getAgencyByUserId:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};
// controllers/agencyController.js
const { Agency, User } = require("../models");
const crypto  = require("crypto");
const bcrypt  = require("bcryptjs");          
const { sendEmail } = require("../config/mailer");

// ➕ ADMIN TẠO TRỰC TIẾP AGENCY
exports.adminCreateAgency = async (req, res) => {
  try {
    const { name, username: userProvidedUsername, email, phone, address, tax_code, business_license, website, password } = req.body;
    
    // Support cả name và username field
    const agencyName = name || userProvidedUsername;
    
    console.log("🔰 Admin creating agency with data:", { 
      agencyName, 
      email, 
      phone,
      originalRequest: { name, username: userProvidedUsername }
    });
    
    // Validate required fields
    if (!agencyName || !email || !phone || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Thiếu thông tin bắt buộc: name/username, email, phone, password",
        received: { agencyName, email, phone, password: password ? "***" : "missing" }
      });
    }

    // Check email đã tồn tại
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "Email đã được sử dụng trong hệ thống" 
      });
    }

    const existingAgency = await Agency.findOne({ where: { email } });
    if (existingAgency) {
      return res.status(400).json({ 
        success: false,
        message: "Email agency đã tồn tại" 
      });
    }

    // Tạo username unique từ email
    let baseUsername = email.split("@")[0];
    let username = baseUsername;
    let counter = 1;
    
    while (await User.findOne({ where: { username } })) {
      username = `${baseUsername}_${counter}`;
      counter++;
    }

    // Hash password với validation
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: "Password không hợp lệ" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Validate hashed password
    if (!hashedPassword) {
      throw new Error("Password hashing failed");
    }
    
    console.log("✅ Password hashed successfully");

    // Tạo user với status active (admin tạo = auto approved)
    const user = await User.create({
      name: agencyName,
      username,
      email,
      password_hash: hashedPassword,
      role: "agency",
      status: "active", // Admin tạo = auto active
      isVerified: true
    });

    // Tạo agency với status approved (admin tạo = auto approved)
    const agency = await Agency.create({
      name: agencyName,
      user_id: user.id,
      email,
      phone,
      address: address || "",
      tax_code: tax_code || "",
      business_license: business_license || "",
      website: website || null,
      status: "approved" // Admin tạo = auto approved
    });

    console.log(`✅ Admin created agency: ${agency.name} (${agency.id})`);

    // Gửi email thông báo cho agency
    try {
      await sendEmail(
        user.email,
        "🎉 Tài khoản Agency đã được tạo bởi Admin",
        `
        <h2>🎉 Chào mừng bạn đến với hệ thống!</h2>
        <p>Tài khoản Agency <strong>${agency.name}</strong> đã được Admin tạo thành công.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>📋 Thông tin đăng nhập:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Mật khẩu:</strong> ${password}</p>
          <p><strong>Username:</strong> ${username}</p>
        </div>
        
        <p><strong>Trạng thái:</strong> Đã duyệt và kích hoạt</p>
        <p><strong>Quyền:</strong> Có thể tạo và quản lý tours ngay lập tức</p>
        
        <p>🔐 <em>Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu để bảo mật.</em></p>
        <p>📞 Liên hệ admin nếu cần hỗ trợ.</p>
        `
      );
      console.log("📧 Welcome email sent to agency");
    } catch (emailError) {
      console.error("📧 Email sending failed:", emailError);
      // Không fail request vì agency đã tạo thành công
    }

    // Reload với user info
    const fullAgency = await Agency.findByPk(agency.id, {
      include: [{ 
        model: User, 
        as: 'user',
        attributes: ['id', 'name', 'email', 'username', 'status', 'role']
      }]
    });

    return res.status(201).json({
      success: true,
      message: `Agency "${name}" đã được tạo thành công và tự động duyệt`,
      data: {
        agency: fullAgency,
        credentials: {
          email,
          username,
          tempPassword: password
        },
        createdBy: req.user.email,
        createdAt: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error("❌ Error in admin createAgency:", err);
    res.status(500).json({ 
      success: false,
      message: "Lỗi khi tạo agency",
      error: err.message 
    });
  }
};


exports.publicRequestAgency = async (req, res) => {
  try {
    const { name, email, phone, address,
            tax_code, business_license, website } = req.body;

   
    if (!name || !email || !phone)
      return res.status(400).json({ message: "Thiếu trường bắt buộc" });

    // 2. Check email đã từng gửi
    const exist = await Agency.findOne({ where: { email } });
    if (exist) return res.status(400).json({ message: "Email đã gửi yêu cầu trước" });

    // 3. Tạo hoặc lấy user (status = inactive)
    let user = await User.findOne({ where: { email } });
    if (!user) {
      // Tạo username unique từ email
      let baseUsername = email.split("@")[0];
      let username = baseUsername;
      let counter = 1;
      
      // Kiểm tra và tạo username unique
      while (await User.findOne({ where: { username } })) {
        username = `${baseUsername}_${counter}`;
        counter++;
      }

      const tempPass    = crypto.randomBytes(6).toString("hex");   // mật khẩu tạm
      const passHash    = await bcrypt.hash(tempPass, 10);
      const tempToken   = crypto.randomBytes(32).toString("hex");  // để đặt pass lần đầu

      user = await User.create({
        name,
        username,               
        email,
        password_hash: passHash,   
        role:    "agency",
        status:  "inactive",
        temp_password_token: tempToken
      });

      // Gửi link đặt mật khẩu thật cho user (sau khi admin duyệt)
      console.log(`🔐 User tạm tạo cho agency: ${email} - username: ${username}`);
    }

    // 4. Tạo agency (pending)
    const agency = await Agency.create({
      name,
      user_id:  user.id,
      email,
      phone,
      address:  address  || "",
      tax_code: tax_code || "",
      business_license: business_license || "",
      website:  website || null,
      status: "pending"
    });

    // 5. Thông báo admin
    await sendEmail(
      process.env.ADMIN_EMAIL,
      "Yêu cầu agency mới",
      `<p>Agency <strong>${name}</strong> (${email}) đang chờ duyệt.</p>
       <p>Link duyệt: <a href="${process.env.BASE_URL}/api/agencies/approve/${agency.id}">Duyệt Agency</a></p>`
    );

    return res.status(201).json({
      message: "Đã gửi yêu cầu – chúng tôi sẽ liên hệ khi phê duyệt.",
      data: { agencyId: agency.id }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* --------------------------------------------- */
/* 2)  ADMIN DUYỆT AGENCY                        */
/* --------------------------------------------- */
exports.approveAgency = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id, { include: "user" });
    if (!agency) return res.status(404).json({ message: "Không tìm thấy agency" });

    // 1. Đánh dấu approved
    await agency.update({ status: "approved" });

    // 2. Kích hoạt user
    const user = agency.user;
    await user.update({ status: "active", role: "agency" });

    // 3. Gửi mail kêu đặt mật khẩu
    const resetLink = `${process.env.FRONTEND_URL}/set-password?token=${user.temp_password_token}`;
    await sendEmail(
      user.email,
      "Agency đã được phê duyệt",
      `<p>Chúc mừng! Agency <strong>${agency.name}</strong> đã được phê duyệt.</p>
       <p><a href="${resetLink}">Nhấn vào đây để đặt mật khẩu đầu tiên</a></p>`
    );

    return res.status(200).json({
      message: "Đã phê duyệt agency & kích hoạt user",
      data: { agencyId: agency.id, userId: user.id }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
};

/* LẤY DANH SÁCH AGENCY (Admin) */

exports.getAgencies = async (req, res) => {
  try {
    // /api/agencies?page=1&limit=20&status=pending
    const page   = +req.query.page  || 1;
    const limit  = +req.query.limit || 20;
    const where  = req.query.status ? { status: req.query.status } : {};

    const { count, rows } = await Agency.findAndCountAll({
      where,
      offset: (page - 1) * limit,
      limit,
      include: [{ model: User, as: "user", attributes: ["id","name","email","status"] }],
      order: [["created_at", "DESC"]]
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count/limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* LẤY CHI TIẾT AGENCY */

exports.getAgency = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id, {
      include: [{ model: User, as: "user", attributes: ["id","name","email","status"] }]
    });

    if (!agency) return res.status(404).json({ message: "Không tìm thấy agency" });

    // Nếu role=agency, chỉ cho xem chính mình
    if (req.user.role === "agency" && req.user.id !== agency.user_id)
      return res.status(403).json({ message: "Không có quyền xem agency khác" });

    res.json({ data: agency });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* KHÓA/MỞ KHÓA AGENCY (Admin) */
exports.toggleLockAgency = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "lock" hoặc "unlock"
    
    const agency = await Agency.findByPk(id, { include: "user" });
    if (!agency) return res.status(404).json({ message: "Không tìm thấy agency" });

    const user = agency.user;
    if (!user) return res.status(404).json({ message: "Không tìm thấy user của agency" });

    let newStatus, newUserStatus, message;
    
    if (action === "lock") {
      newStatus = "locked";
      newUserStatus = "inactive"; 
      message = "Đã khóa agency";
    } else if (action === "unlock") {
      newStatus = "approved";
      newUserStatus = "active";
      message = "Đã mở khóa agency";
    } else {
      return res.status(400).json({ message: "Action phải là 'lock' hoặc 'unlock'" });
    }

    // Cập nhật agency và user
    await agency.update({ status: newStatus });
    await user.update({ status: newUserStatus });

    // Gửi email thông báo cho agency
    const { sendEmail } = require("../config/mailer");
    try {
      if (action === "lock") {
        await sendEmail(
          user.email,
          "Tài khoản Agency bị khóa",
          `<p>Tài khoản Agency <strong>${agency.name}</strong> đã bị khóa.</p>
           <p>Vui lòng liên hệ admin để biết thêm chi tiết.</p>`
        );
      } else {
        await sendEmail(
          user.email,
          "Tài khoản Agency được mở khóa",
          `<p>Tài khoản Agency <strong>${agency.name}</strong> đã được mở khóa.</p>
           <p>Bạn có thể đăng nhập và sử dụng dịch vụ bình thường.</p>`
        );
      }
    } catch (emailError) {
      console.error("Lỗi gửi email:", emailError);
      // Không return error vì action chính đã thành công
    }

    res.json({
      message,
      data: { agencyId: agency.id, userId: user.id, status: newStatus }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
};

/* XÓA AGENCY (Admin) */
exports.deleteAgency = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanently = false } = req.body; // Xóa vĩnh viễn hay chỉ đánh dấu
    
    const agency = await Agency.findByPk(id, { include: "user" });
    if (!agency) return res.status(404).json({ message: "Không tìm thấy agency" });

    const user = agency.user;

    if (permanently) {
      // Xóa vĩnh viễn - cần kiểm tra ràng buộc
      // Kiểm tra xem agency có tours/bookings không
      const { Tour, Booking } = require("../models");
      
      const tourCount = await Tour.count({ where: { agency_id: id } });
      const bookingCount = await Booking.count({ 
        include: [{ 
          model: Tour, 
          where: { agency_id: id } 
        }]
      });

      if (tourCount > 0 || bookingCount > 0) {
        return res.status(400).json({ 
          message: `Không thể xóa agency. Còn ${tourCount} tours và ${bookingCount} bookings liên quan.`,
          data: { tourCount, bookingCount }
        });
      }

      // Xóa agency và user
      if (user) await user.destroy();
      await agency.destroy();

      res.json({
        message: "Đã xóa vĩnh viễn agency và user",
        data: { agencyId: id, permanently: true }
      });
    } else {
      // Chỉ đánh dấu xóa (soft delete)
      await agency.update({ status: "deleted" });
      if (user) await user.update({ status: "inactive" });

      // Gửi email thông báo
      const { sendEmail } = require("../config/mailer");
      try {
        if (user) {
          await sendEmail(
            user.email,
            "Tài khoản Agency bị xóa",
            `<p>Tài khoản Agency <strong>${agency.name}</strong> đã bị xóa khỏi hệ thống.</p>
             <p>Vui lòng liên hệ admin nếu cần hỗ trợ.</p>`
          );
        }
      } catch (emailError) {
        console.error("Lỗi gửi email:", emailError);
      }

      res.json({
        message: "Đã đánh dấu xóa agency",
        data: { agencyId: id, permanently: false }
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
};
