const { sequelize } = require('./models');

async function removeLocationIdColumn() {
  try {
    // Kiểm tra cột location_id có tồn tại không
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tour_booking_db'}'
      AND TABLE_NAME = 'destination'
      AND COLUMN_NAME = 'location_id'
    `);

    if (columns.length > 0) {
      // Tìm foreign key constraint liên quan đến location_id
      const [constraints] = await sequelize.query(`
        SELECT CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tour_booking_db'}'
        AND TABLE_NAME = 'destination'
        AND COLUMN_NAME = 'location_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `);
      for (const constraint of constraints) {
        console.log(`Đang xóa foreign key constraint: ${constraint.CONSTRAINT_NAME}`);
        await sequelize.query(`ALTER TABLE destination DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`);
      }
      await sequelize.query('ALTER TABLE destination DROP COLUMN location_id');
      console.log('Đã xóa cột location_id khỏi bảng destination!');
    } else {
      console.log('Bảng destination không có cột location_id, không cần xóa.');
    }
  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

removeLocationIdColumn(); 