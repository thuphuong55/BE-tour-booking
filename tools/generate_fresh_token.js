require('dotenv').config();
const jwt = require('jsonwebtoken');

// Generate a fresh token for the locked agency with CORRECT USER ID
const payload = {
  id: 'cddd6d03-ec27-4354-9a4e-904fa45a013b', // Correct user ID
  email: 'thuthu060403@gmail.com',
  role: 'agency',
  agencyId: '487ef622-57b5-43a1-8d40-e02792bcc1d4'
};

// Use the same JWT secret as the server
const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key-here';
const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

console.log('JWT Secret being used:', jwtSecret);
console.log('Fresh token for CORRECT agency user:');
console.log(token);
