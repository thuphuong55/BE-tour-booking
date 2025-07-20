const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    
    // 🚀 OPTIMIZATION: Connection Pool
    pool: {
      max: 20,          // Tối đa 20 connections
      min: 5,           // Tối thiểu 5 connections
      acquire: 30000,   // Timeout 30s để lấy connection
      idle: 10000,      // 10s idle trước khi disconnect
      evict: 1000       // Check expired connections mỗi 1s
    },
    
    // 🚀 OPTIMIZATION: Query Performance
    logging: false,                    // Tắt logging trong production
    benchmark: true,                   // Đo thời gian query
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast: true,
      timeout: 10000                   // Query timeout 10s
    },
    
    // 🚀 OPTIMIZATION: Connection Settings
    define: {
      freezeTableName: true,           // Không pluralize table names
      timestamps: true,                // Tự động timestamps
      paranoid: false,                 // Không soft delete
      underscored: true               // snake_case cho columns
    },
    
    // 🚀 OPTIMIZATION: Query Optimization
    quoteIdentifiers: false,          // Faster queries
    omitNull: true,                   // Skip null values
    transactionType: 'IMMEDIATE'      // Faster transactions
  }
);

console.log( process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_HOST);
// 🚀 Health check connection với pool monitoring
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected with optimized pool');
    
    // Log pool status mỗi phút để monitor
    setInterval(() => {
      const pool = sequelize.connectionManager.pool;
      if (pool) {
        console.log(`📊 DB Pool: ${pool.using}/${pool.size} active, ${pool.waiting} waiting`);
      }
    }, 60000);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
