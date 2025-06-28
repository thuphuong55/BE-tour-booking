
const { where } = require("sequelize");
const { Agency } = require("../models");
const { User } = require("../models");
exports.requestAgency = async (req, res) => {
  try {
      const userId = req.user.id; // user đã đăng nhập
      const { name, email, phone, address, tax_code, business_license, website } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin" });
      }
    // Kiểm tra xem đã tồn tại agency với email user chưa
    let agency = await Agency.findOne({ where: { email: email } });
    if (agency) {
        return res.status(400).json({ message: "Email đã được sử dụng để đăng ký agency" });
    }
    if (agency) {
      if (agency.status === "approved")
        return res.status(400).json({ message: "Bạn đã là agency" });

      if (agency.status === "pending")
        return res.status(200).json({ message: "Yêu cầu đang chờ duyệt" });

      // Nếu bị từ chối hoặc suspended => cho phép gửi lại
      await agency.update({ status: "pending" });
      return res.status(200).json({ message: "Yêu cầu đã gửi lại thành công" });
    }

    // Nếu chưa tồn tại thì tạo mới
    await Agency.create({
      name: name,
      user_id: userId, // liên kết với user
      email: email,
      phone: phone,
      address: address || "",
      tax_code: tax_code || "",
      business_license: business_license || "",
      website: website || null,
      status: "pending",
    });

    return res.status(201).json({ message: "Đã gửi yêu cầu trở thành agency" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.approvedAgency = async (req, res) => {
  try {
    const agencyId = req.params.id;

    // 1. Tìm agency theo ID
    const agency = await Agency.findByPk(agencyId);
    if (!agency) {
      return res.status(404).json({ message: "Agency không tồn tại" });
    }

    // 2. Cập nhật trạng thái agency
    await agency.update({ status: "approved" });

    // 3. Cập nhật vai trò của user liên quan
    const user = await User.findByPk(agency.user_id);
    if (user) {
      await user.update({ role: "agency" });
    }

    // 4. Phản hồi
    return res.status(200).json({
      message: "Đã phê duyệt agency và cập nhật quyền người dùng",
      data: {
        agencyId: agency.id,
        status: agency.status,
        userId: agency.user_id,
        newRole: "agency"
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server: " + err.message });
  }
};

exports.getAllAgencies = async (req, res) => {
  try {
    const agencies = await Agency.findAll();
    res.json({
        message: "Danh sách agency",
        data: agencies
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
Agency.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasOne(Agency, { foreignKey: "user_id", as: "agency" });


