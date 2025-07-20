require('dotenv').config();
const app = require('./app');
const detectPort = require('detect-port').default; 
const cron = require("node-cron");
const expireBookingsJob = require("./jobs/expireBookings");

const DEFAULT_PORT = process.env.PORT || 5001;

// Performance optimization: Pre-configure server settings
const serverOptions = {
  keepAlive: true,
  keepAliveTimeout: 5000,
  headersTimeout: 6000,
  maxHeadersCount: 2000,
  timeout: 30000
};

detectPort(DEFAULT_PORT).then(port => {
  const server = app.listen(port, () => {
    console.log(`🚀 Optimized Server running on port ${port}`);
    console.log(`📊 Performance monitoring enabled`);
    console.log(`🔧 Connection pooling: Active`);
    console.log(`⚡ Response compression: Enabled`);
  });

  // Apply server optimizations
  Object.assign(server, serverOptions);
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

}).catch(err => {
  console.error('❌ Server startup error:', err);
});


// Chạy mỗi 15 phút với async handling để tránh blocking
cron.schedule("*/15 * * * *", async () => {
  console.log("[Cron] 🔄 Đang kiểm tra booking hết hạn...");
  
  // Wrap trong setImmediate để tránh blocking main thread
  setImmediate(async () => {
    try {
      await expireBookingsJob();
    } catch (error) {
      console.error("[Cron] ❌ Lỗi trong expire job:", error.message);
    }
  });
}, {
  scheduled: true,
  timezone: "Asia/Ho_Chi_Minh"
});

