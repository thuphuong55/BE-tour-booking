const { User, Agency } = require('./models');

async function checkAgencyUserStatus() {
  try {
    console.log('=== CHECK AGENCY USER STATUS ===');
    
    const user = await User.findOne({ 
      where: { email: 'agency12@gmail.com' },
      include: [{ model: Agency, as: 'agency' }]
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('User info:', {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      agency_id: user.agency?.id,
      agency_status: user.agency?.status
    });
    
    // Update user status to active if needed
    if (user.status !== 'active') {
      console.log('\n🔧 Updating user status to active...');
      await user.update({ status: 'active' });
      console.log('✅ User status updated');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAgencyUserStatus();
