const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function createTestAdmin() {
  try {
    console.log('🔧 Creating test admin user...');
    
    // Check if test admin exists
    const existingAdmin = await User.findOne({
      where: { email: 'test-admin@example.com' }
    });
    
    if (existingAdmin) {
      console.log('✅ Test admin already exists');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return existingAdmin;
    }
    
    // Create new admin
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const newAdmin = await User.create({
      name: 'Test Admin',
      email: 'test-admin@example.com',
      password: hashedPassword,
      role: 'admin',
      phone: '0123456789'
    });
    
    console.log('✅ Test admin created successfully!');
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Password: test123`);
    console.log(`   Role: ${newAdmin.role}`);
    
    return newAdmin;
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    process.exit(0);
  }
}

createTestAdmin();
