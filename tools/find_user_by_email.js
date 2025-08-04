const { User } = require('./models');

(async () => {
  try {
    const users = await User.findAll({
      where: { email: 'thuthu060403@gmail.com' },
      attributes: ['id', 'name', 'email', 'status', 'role', 'username']
    });
    console.log('Users with email thuthu060403@gmail.com:', users.map(u => u.toJSON()));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
