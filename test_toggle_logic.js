const { Agency, User } = require('./models');

(async () => {
  try {
    console.log('🧪 Testing toggleLockAgency logic...');
    
    const agencyId = '487ef622-57b5-43a1-8d40-e02792bcc1d4';
    
    // Simulate the controller logic
    const agency = await Agency.findByPk(agencyId, { include: 'user' });
    console.log('Agency found:', !!agency);
    console.log('User found:', !!agency?.user);
    
    if (agency && !agency.user) {
      console.log('🔧 Orphan agency detected, would create new user...');
      console.log('Agency details:', {
        id: agency.id,
        name: agency.name,
        user_id: agency.user_id,
        email: agency.email
      });
      
      // Test tạo user mới
      const crypto = require("crypto");
      const bcrypt = require("bcryptjs");
      
      // Tạo username từ agency name
      let baseUsername = agency.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove special chars
        .substring(0, 20); // Limit length
        
      let username = baseUsername;
      let counter = 1;
      
      // Ensure unique username
      while (await User.findOne({ where: { username } })) {
        username = `${baseUsername}_${counter}`;
        counter++;
      }
      
      console.log('Generated username:', username);
      
      // Tạo password tạm thời
      const tempPassword = crypto.randomBytes(8).toString("hex");
      const hashedPassword = await bcrypt.hash(tempPassword, 12);
      
      console.log('Temp password:', tempPassword);
      console.log('Would create user with ID:', agency.user_id);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
