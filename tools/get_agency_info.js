const { User, Agency } = require('./models');

(async () => {
  try {
    const agencies = await Agency.findAll({
      where: {
        id: ['d3a463c7-fa0f-486c-8b89-8429c5640186', '855ff6be-bed7-497c-84e0-4230faa2c61a']
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'name', 'role']
      }]
    });
    
    console.log('🏢 Agency Information:');
    agencies.forEach(agency => {
      console.log(`\nAgency ID: ${agency.id}`);
      console.log(`Agency Name: ${agency.agency_name}`);
      if (agency.User) {
        console.log(`User ID: ${agency.User.id}`);
        console.log(`Email: ${agency.User.email}`);
        console.log(`Name: ${agency.User.name}`);
        console.log(`Role: ${agency.User.role}`);
      } else {
        console.log('⚠️ No user linked to this agency');
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
