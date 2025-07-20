const { User } = require('./models');
const bcrypt = require('bcrypt');

async function resetAgencyPassword() {
  try {
    console.log('=== RESET AGENCY PASSWORD ===');
    
    const user = await User.findOne({ 
      where: { email: 'agency12@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ User agency12@gmail.com không tồn tại');
      return;
    }
    
    console.log('✅ User found:', user.email);
    
    // Hash password mới
    const hashedPassword = await bcrypt.hash('123456', 12);
    await user.update({ password_hash: hashedPassword });
    
    console.log('✅ Password đã được reset thành "123456"');
    
    // Test password
    const passwordMatch = await bcrypt.compare('123456', hashedPassword);
    console.log('✅ Password verification:', passwordMatch);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

resetAgencyPassword();
