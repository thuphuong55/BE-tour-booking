const { sequelize } = require('./models');

async function checkDatabaseStructure() {
  try {
    console.log('=== Kiểm tra cấu trúc bảng location ===');
    const [locationColumns] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tour_booking_db'}' 
      AND TABLE_NAME = 'location'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Các cột trong bảng location:');
    locationColumns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} (nullable: ${col.IS_NULLABLE})`);
    });

    console.log('\n=== Kiểm tra cấu trúc bảng destination ===');
    const [destinationColumns] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tour_booking_db'}' 
      AND TABLE_NAME = 'destination'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Các cột trong bảng destination:');
    destinationColumns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} (nullable: ${col.IS_NULLABLE})`);
    });

    console.log('\n=== Kiểm tra foreign key constraints ===');
    const [constraints] = await sequelize.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tour_booking_db'}' 
      AND (TABLE_NAME = 'location' OR TABLE_NAME = 'destination')
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (constraints.length > 0) {
      console.log('Foreign key constraints:');
      constraints.forEach(constraint => {
        console.log(`- ${constraint.CONSTRAINT_NAME}: ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('Không có foreign key constraints nào');
    }

    // Kiểm tra xem có cột location_id trong bảng destination không
    const hasLocationId = destinationColumns.some(col => col.COLUMN_NAME === 'location_id');
    if (hasLocationId) {
      console.log('\n⚠️  CẢNH BÁO: Bảng destination có cột location_id - điều này SAI theo thiết kế!');
    }

  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

checkDatabaseStructure(); 