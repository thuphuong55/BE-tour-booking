const { User } = require('./models');

async function checkUserTable() {
    try {
        // Get table structure
        const tableDescription = await User.describe();
        console.log('User table structure:');
        console.log(tableDescription);
        
        // Get existing users
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role', 'status'],
            limit: 5
        });
        
        console.log('\nExisting users:');
        users.forEach(user => {
            console.log(`- ${user.email} (${user.role}) - ${user.status}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkUserTable();
