const { User } = require("../models");
const bcrypt = require("bcryptjs");
async function createGuestUser() {
  try {
    // Thông tin user mặc định, có thể chỉnh sửa lại cho phù hợp
    const plainPassword = "guest123";
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const guestData = {
      name: "Guest User",
      username: "guest",
      email: "guest@tour.com",
      password_hash: passwordHash,
      phone: "0000000000",
      role: "guest", // Nếu có trường role
      // ...thêm các trường khác nếu cần
    };

    // Kiểm tra đã tồn tại chưa
    let guest = await User.findOne({ where: { email: guestData.email } });
    if (guest) {
      console.log("User guest đã tồn tại:", guest.id);
      return guest;
    }
    guest = await User.create(guestData);
    console.log("Tạo user guest thành công, id:", guest.id);
    return guest;
  } catch (err) {
    console.error("Lỗi tạo user guest:", err.message);
  }
}

// Nếu muốn chạy trực tiếp bằng node
if (require.main === module) {
  createGuestUser();
}

module.exports = createGuestUser;
