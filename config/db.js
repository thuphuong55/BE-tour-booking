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
    logging: false,
  }
);

console.log( process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_HOST);
// Kiểm tra kết nối cơ sở dữ liệu
const connectDB = async () => {
  try {
    await sequelize.sync();
    console.log('MySQL connected');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
