const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'tour_booking_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || null,
  {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false
  }
);

async function fixMigration() {
  try {
    console.log('Đang kết nối database...');
    await sequelize.authenticate();
    console.log('Kết nối thành công!');

    // Kiểm tra xem cột có tồn tại không
    console.log('Đang kiểm tra cột departure_date_id...');
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tour_booking_db'}' 
      AND TABLE_NAME = 'booking' 
      AND COLUMN_NAME = 'departure_date_id'
    `);

    if (columns.length > 0) {
      // Tìm tên constraint
      const [constraints] = await sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tour_booking_db'}' 
        AND TABLE_NAME = 'booking' 
        AND COLUMN_NAME = 'departure_date_id' 
        AND CONSTRAINT_NAME != 'PRIMARY'
      `);
      for (const constraint of constraints) {
        console.log(`Đang xóa foreign key constraint: ${constraint.CONSTRAINT_NAME}`);
        await sequelize.query(`ALTER TABLE booking DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`);
      }
      console.log('Đang xóa cột departure_date_id...');
      await sequelize.query('ALTER TABLE booking DROP COLUMN departure_date_id');
      console.log('Xóa cột thành công!');
    } else {
      console.log('Cột departure_date_id không tồn tại, bỏ qua.');
    }

    console.log('Đang đóng kết nối...');
    await sequelize.close();
    console.log('Hoàn thành!');
  } catch (error) {
    console.error('Lỗi:', error.message);
    await sequelize.close();
  }
}

fixMigration(); 