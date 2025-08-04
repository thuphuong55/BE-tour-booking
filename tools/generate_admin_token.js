const jwt = require('jsonwebtoken');

// Tạo token cho admin
const payload = {
  id: 'admin-user-id',
  email: 'admin@test.com', 
  role: 'admin'
};

const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '24h' });

console.log('=== ADMIN TOKEN ===');
console.log(token);
