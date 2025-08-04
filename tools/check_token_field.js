const { User } = require('./models');

async function checkTokenInvalidationField() {
  try {
    const user = await User.findOne({
      where: { id: 'cddd6d03-ec27-4354-9a4e-904fa45a013b' },
      attributes: ['id', 'status', 'token_invalidated_at']
    });
    
    if (user) {
      console.log('Raw user data:');
      console.log(JSON.stringify(user.dataValues, null, 2));
      
      console.log('\nFormatted:');
      console.log('User ID:', user.id);
      console.log('Status:', user.status);
      console.log('Token invalidated at:', user.token_invalidated_at);
      console.log('Token invalidated at type:', typeof user.token_invalidated_at);
      
      // Check if field exists in database schema
      console.log('\nDataValues keys:', Object.keys(user.dataValues));
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTokenInvalidationField();
