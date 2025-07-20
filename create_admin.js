const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
    try {
        // Check if admin exists
        const existingAdmin = await User.findOne({ where: { email: 'admin@test.com' } });
        
        if (existingAdmin) {
            console.log('Admin user already exists');
            console.log('Email:', existingAdmin.email);
            console.log('Role:', existingAdmin.role);
            return;
        }
        
        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        const adminUser = await User.create({
            username: `admin_${Date.now()}`,
            email: 'admin@test.com',
            password_hash: hashedPassword,
            role: 'admin',
            status: 'active',
            name: 'Admin System',
            isVerified: true
        });
        
        console.log('✅ Admin user created successfully');
        console.log('Email:', adminUser.email);
        console.log('Password: admin123');
        console.log('Role:', adminUser.role);
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
    } finally {
        process.exit(0);
    }
}

createAdminUser();
