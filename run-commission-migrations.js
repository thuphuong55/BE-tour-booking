const { sequelize } = require('./config/db');

async function runCommissionMigrations() {
  try {
    console.log('Chạy migrations cho hệ thống hoa hồng...');

    // 1. Thêm các trường hoa hồng vào booking
    console.log('1. Thêm trường hoa hồng vào bảng booking...');
    
    const [commissionFields] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'booking' AND COLUMN_NAME = 'commission_rate'
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (commissionFields.length === 0) {
      await sequelize.query(`
        ALTER TABLE booking 
        ADD COLUMN commission_rate DECIMAL(5,2) NULL COMMENT 'Tỷ lệ hoa hồng admin (%)',
        ADD COLUMN admin_commission DECIMAL(12,2) NULL COMMENT 'Số tiền hoa hồng admin nhận được',
        ADD COLUMN agency_amount DECIMAL(12,2) NULL COMMENT 'Số tiền agency nhận được sau khi trừ hoa hồng',
        ADD COLUMN commission_calculated_at DATETIME NULL COMMENT 'Thời điểm tính hoa hồng'
      `);
      
      await sequelize.query(`
        CREATE INDEX idx_booking_commission_calculated_at ON booking(commission_calculated_at)
      `);
      
      console.log('✅ Đã thêm trường hoa hồng vào booking');
    } else {
      console.log('✅ Trường hoa hồng đã tồn tại trong booking');
    }

    // 2. Tạo bảng commission_settings
    console.log('2. Tạo bảng commission_settings...');
    
    const [settingsTable] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'commission_settings' AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (settingsTable.length === 0) {
      await sequelize.query(`
        CREATE TABLE commission_settings (
          id CHAR(36) PRIMARY KEY,
          user_id CHAR(36) NOT NULL,
          commission_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00 COMMENT 'Tỷ lệ hoa hồng admin (%)',
          min_booking_value DECIMAL(12,2) NULL COMMENT 'Giá trị booking tối thiểu',
          max_booking_value DECIMAL(12,2) NULL COMMENT 'Giá trị booking tối đa',
          tour_category_id CHAR(36) NULL COMMENT 'Áp dụng cho danh mục tour cụ thể',
          effective_from DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          effective_to DATETIME NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_cs_user_id (user_id),
          INDEX idx_cs_category (tour_category_id),
          INDEX idx_cs_effective (effective_from, effective_to),
          INDEX idx_cs_active (is_active),
          
          FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
          FOREIGN KEY (tour_category_id) REFERENCES tour_category(id) ON UPDATE CASCADE ON DELETE SET NULL
        )
      `);
      
      console.log('✅ Đã tạo bảng commission_settings');
    } else {
      console.log('✅ Bảng commission_settings đã tồn tại');
    }

    // 3. Thêm một số cấu hình hoa hồng mặc định
    console.log('3. Thêm cấu hình hoa hồng mặc định...');
    
    const [existingSettings] = await sequelize.query(`
      SELECT COUNT(*) as count FROM commission_settings
    `);
    
    if (existingSettings[0].count === 0) {
      // Lấy danh sách agencies
      const [agencies] = await sequelize.query(`
        SELECT id, name FROM users WHERE role LIKE '%agency%' LIMIT 3
      `);
      
      for (const agency of agencies) {
        const settingId = require('uuid').v4();
        await sequelize.query(`
          INSERT INTO commission_settings (id, user_id, commission_rate, effective_from)
          VALUES (?, ?, ?, NOW())
        `, {
          replacements: [settingId, agency.id, 15.00]
        });
        
        console.log(`   - Đã tạo cấu hình hoa hồng 15% cho ${agency.name}`);
      }
    } else {
      console.log('✅ Đã có cấu hình hoa hồng');
    }

    console.log('\n🎉 Hoàn thành migrations hệ thống hoa hồng!');

  } catch (error) {
    console.error('❌ Lỗi chạy migrations:', error.message);
  } finally {
    process.exit();
  }
}

runCommissionMigrations();
