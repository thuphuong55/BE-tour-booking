const { sequelize } = require('./config/db');

async function runMigration() {
  try {
    console.log('Thêm location_id vào bảng hotels...');
    
    // Kiểm tra xem cột đã tồn tại chưa
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'hotels' AND COLUMN_NAME = 'location_id'
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (results.length > 0) {
      console.log('Cột location_id đã tồn tại trong bảng hotels');
    } else {
      // Bước 1: Thêm cột location_id
      await sequelize.query(`ALTER TABLE hotels ADD COLUMN location_id CHAR(36) NULL`);
      console.log('✅ Đã thêm cột location_id');
      
      // Bước 2: Thêm index
      await sequelize.query(`CREATE INDEX idx_hotels_location ON hotels(location_id)`);
      console.log('✅ Đã tạo index');
      
      // Bước 3: Kiểm tra kiểu dữ liệu của cả hai cột
      const [locationIdType] = await sequelize.query(`
        SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'location' AND COLUMN_NAME = 'id'
        AND TABLE_SCHEMA = DATABASE()
      `);
      
      const [hotelLocationIdType] = await sequelize.query(`
        SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, COLUMN_TYPE  
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'hotels' AND COLUMN_NAME = 'location_id'
        AND TABLE_SCHEMA = DATABASE()
      `);
      
      console.log('Kiểu dữ liệu location.id:', locationIdType[0]);
      console.log('Kiểu dữ liệu hotels.location_id:', hotelLocationIdType[0]);
      
      // Bước 4: Thêm foreign key constraint
      try {
        await sequelize.query(`
          ALTER TABLE hotels 
          ADD CONSTRAINT fk_hotels_location 
          FOREIGN KEY (location_id) REFERENCES location(id) 
          ON UPDATE CASCADE ON DELETE SET NULL
        `);
        console.log('✅ Đã tạo foreign key constraint');
      } catch (fkError) {
        console.log('⚠️ Không thể tạo foreign key constraint:', fkError.message);
        console.log('Nhưng cột location_id đã được thêm thành công!');
      }
      
      console.log('✅ Đã thêm cột location_id vào bảng hotels thành công!');
    }
    
    // Kiểm tra cột description trong location
    const [descResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'location' AND COLUMN_NAME = 'description'
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (descResults.length > 0) {
      console.log('Cột description đã tồn tại trong bảng location');
    } else {
      await sequelize.query(`
        ALTER TABLE location 
        ADD COLUMN description TEXT NULL
      `);
      
      console.log('✅ Đã thêm cột description vào bảng location thành công!');
    }
    
  } catch (error) {
    console.error('Lỗi khi chạy migration:', error.message);
  } finally {
    process.exit();
  }
}

runMigration();
