const mysql = require('mysql2/promise');
require('dotenv').config();

const updateAgencyStatusEnum = async () => {
  try {
    console.log('🔧 Cập nhật ENUM status cho bảng agency...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Cập nhật ENUM để thêm 'locked' và 'deleted'
    const alterQuery = `
      ALTER TABLE agency 
      MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'suspended', 'locked', 'deleted') 
      DEFAULT 'pending'
    `;

    await connection.execute(alterQuery);
    console.log('✅ Đã cập nhật ENUM status cho bảng agency');

    // Kiểm tra kết quả
    const [rows] = await connection.execute("SHOW COLUMNS FROM agency LIKE 'status'");
    console.log('📋 Status column info:', rows[0]);

    await connection.end();
    console.log('🎉 Migration hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi migration:', error);
  }
  
  process.exit();
};

updateAgencyStatusEnum();
