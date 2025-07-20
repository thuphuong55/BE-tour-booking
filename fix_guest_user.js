const { User } = require('./models');

async function createGuestUser() {
  const GUEST_USER_ID = "3ca8bb89-a406-4deb-96a7-dab4d9be3cc1";
  
  try {
    // Kiểm tra guest user có tồn tại không
    let guestUser = await User.findByPk(GUEST_USER_ID);
    
    if (guestUser) {
      console.log('✅ Guest user đã tồn tại:', guestUser.toJSON());
    } else {
      // Tạo guest user mới
      guestUser = await User.create({
        id: GUEST_USER_ID,
        name: "Guest User",
        email: "guest@tour.com",
        username: "guest",
        password: "guest123", // Dummy password
        role: "user",
        status: "active"
      });
      console.log('🎉 Đã tạo Guest user thành công:', guestUser.toJSON());
    }
    
    // Kiểm tra xem có user với ID khác không
    const wrongIdUser = await User.findByPk("guest-user-default-id");
    if (wrongIdUser) {
      console.log('⚠️ Tìm thấy user với ID sai:', wrongIdUser.toJSON());
    } else {
      console.log('✅ Không có user với ID sai');
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
  
  process.exit(0);
}

createGuestUser();
