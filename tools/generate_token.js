const jwt = require('jsonwebtoken');

// Tạo token cho agency 2
const payload = {
  id: '855ff6be-bed7-497c-84e0-4230faa2c61a',
  email: 'agency2@test.com', 
  role: 'agency'
};

const token = jwt.sign(payload, process.env.JWT_SECRET || 'tour_booking_secret_key_2024', { expiresIn: '24h' });

console.log('=== TOKEN CHO AGENCY 2 ===');
console.log(token);
console.log('\n=== LỆNH TEST ===');
console.log('Sao chép token trên và thay vào lệnh dưới:');
console.log('Invoke-RestMethod -Uri "http://localhost:5000/api/departure-dates" -Method GET -Headers @{"Authorization"="Bearer ' + token + '"}');
