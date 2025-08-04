const { User } = require('./models');

async function checkTokenStatus() {
  try {
    const user = await User.findOne({
      where: { id: '487ef622-57b5-43a1-8d40-e02792bcc1d4' }
    });
    
    if (user) {
      console.log('User status:', user.status);
      console.log('Token invalidated at:', user.token_invalidated_at);
      console.log('Is token valid?', !user.token_invalidated_at || new Date() <= user.token_invalidated_at);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTokenStatus();
