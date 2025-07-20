const mysql = require('mysql2/promise');
require('dotenv').config();

const addForgotPasswordFields = async () => {
  try {
    console.log('🔧 Thêm trường forgot password vào bảng users...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Thêm trường forgot_password_otp
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN forgot_password_otp VARCHAR(255) NULL
      `);
      console.log('✅ Đã thêm trường forgot_password_otp');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ Trường forgot_password_otp đã tồn tại');
      } else {
        throw error;
      }
    }

    // Thêm trường forgot_password_otp_expires
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN forgot_password_otp_expires DATETIME NULL
      `);
      console.log('✅ Đã thêm trường forgot_password_otp_expires');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ Trường forgot_password_otp_expires đã tồn tại');
      } else {
        throw error;
      }
    }

    // Kiểm tra kết quả
    const [rows] = await connection.execute("SHOW COLUMNS FROM users");
    console.log('📋 Các trường trong bảng users:');
    rows.forEach(row => {
      if (row.Field.includes('forgot_password')) {
        console.log(`  - ${row.Field}: ${row.Type}`);
      }
    });

    await connection.end();
    console.log('🎉 Migration hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi migration:', error);
  }
  
  process.exit();
};

addForgotPasswordFields();
