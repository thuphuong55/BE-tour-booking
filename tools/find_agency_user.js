const { User, Agency } = require('./models');

async function findAgencyUser() {
  try {
    console.log('Looking for agency with ID: 487ef622-57b5-43a1-8d40-e02792bcc1d4');
    
    const agency = await Agency.findOne({
      where: { id: '487ef622-57b5-43a1-8d40-e02792bcc1d4' },
      include: {
        model: User,
        as: 'user'
      }
    });
    
    if (agency) {
      console.log('Agency found:', agency.name);
      console.log('Agency user_id:', agency.user_id);
      
      if (agency.user) {
        console.log('User ID:', agency.user.id);
        console.log('User status:', agency.user.status);
        console.log('User email:', agency.user.email);
        console.log('Token invalidated at:', agency.user.token_invalidated_at);
      } else {
        console.log('No user associated with this agency');
      }
    } else {
      console.log('Agency not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

findAgencyUser();
