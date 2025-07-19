require('dotenv').config();
const app = require('./app');
const detectPort = require('detect-port').default; 
const cron = require("node-cron");
const expireBookingsJob = require("./jobs/expireBookings");

const DEFAULT_PORT = process.env.PORT || 5001;

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


// Chạy mỗi 15 phút thay vì mỗi phút để giảm spam logs
cron.schedule("*/15 * * * *", async () => {
  console.log("[Cron] Đang kiểm tra booking hết hạn...");
  await expireBookingsJob();
});

