// controllers/agencyController.js
const { Agency, User } = require("../models");
const crypto  = require("crypto");
const bcrypt  = require("bcryptjs");          
const sendMail = require("../config/mailer");


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
      const username    = email.split("@")[0];
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
      console.log(`🔐 User tạm tạo: ${username}/${tempPass}`);
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
    await sendMail(
      process.env.ADMIN_EMAIL,
      "Yêu cầu agency mới",
      `Agency ${name} (${email}) đang chờ duyệt.\nLink duyệt: ${process.env.BASE_URL}/api/agencies/approve/${agency.id}`
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
    await sendMail(
      user.email,
      "Agency đã được phê duyệt",
      `Chúc mừng! Nhấn vào link sau để đặt mật khẩu đầu tiên: ${resetLink}`
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
