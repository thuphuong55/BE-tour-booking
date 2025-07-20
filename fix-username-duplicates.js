const { User } = require('./models');

const fixUsernameDuplicates = async () => {
  try {
    console.log('🔧 Bắt đầu sửa lỗi username duplicates...');
    
    // 1. Tìm tất cả users có username null hoặc rỗng
    const usersWithEmptyUsername = await User.findAll({
      where: {
        username: ['', null]
      }
    });

    console.log(`📋 Tìm thấy ${usersWithEmptyUsername.length} users có username rỗng`);

    // 2. Cập nhật từng user với username unique
    for (let i = 0; i < usersWithEmptyUsername.length; i++) {
      const user = usersWithEmptyUsername[i];
      
      // Tạo username từ email hoặc name
      let baseUsername;
      if (user.email) {
        baseUsername = user.email.split('@')[0];
      } else if (user.name) {
        baseUsername = user.name.toLowerCase().replace(/\s+/g, '_');
      } else {
        baseUsername = `user_${user.id.substring(0, 8)}`;
      }

      // Tạo username unique
      let username = baseUsername;
      let counter = 1;
      
      while (await User.findOne({ where: { username } })) {
        username = `${baseUsername}_${counter}`;
        counter++;
      }

      // Cập nhật user
      await user.update({ username });
      console.log(`✅ Cập nhật user ${user.id}: username = "${username}"`);
    }

    console.log('🎉 Hoàn thành sửa lỗi username duplicates!');
    
  } catch (error) {
    console.error('❌ Lỗi khi sửa username duplicates:', error);
  }
  
  process.exit();
};

fixUsernameDuplicates();
