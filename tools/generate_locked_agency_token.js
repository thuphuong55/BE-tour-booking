const jwt = require('jsonwebtoken');

// Tạo token cho user đã bị lock
const payload = {
  id: 'cddd6d03-ec27-4354-9a4e-904fa45a013b', // User ID đã bị inactive
  email: 'thuthu060403@gmail.com',
  role: 'agency'
};

const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '24h' });

console.log('=== TOKEN FOR LOCKED AGENCY USER ===');
console.log(token);
console.log('\n=== User Info ===');
console.log('ID:', payload.id);
console.log('Email:', payload.email);
console.log('Role:', payload.role);
console.log('Expected Status: inactive (locked)');
