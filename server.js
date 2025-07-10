require('dotenv').config();
const app = require('./app');
const detectPort = require('detect-port').default; // 💥 fix lỗi ở đây

const DEFAULT_PORT = process.env.PORT || 5000;

detectPort(DEFAULT_PORT).then(port => {
  if (port === DEFAULT_PORT) {
    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
    });
  } else {
    console.log(`⚠️ Port ${DEFAULT_PORT} is in use. Switching to ${port}...`);
    app.listen(port, () => {
      console.log(`✅ Server running on fallback port ${port}`);
    });
  }
}).catch(err => {
  console.error('Lỗi kiểm tra port:', err);
});
