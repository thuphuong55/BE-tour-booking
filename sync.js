const db = require('./models');

(async () => {
  try {
    await db.sequelize.sync({ alter: true });  // alter: true giúp update schema tự động
    console.log("✅ Database synchronized successfully.");
    process.exit();
  } catch (err) {
    console.error("❌ Sync failed:", err);
  }
})();

//Mỗi lần sửa model, chỉ cần chạy: " node sync.js "