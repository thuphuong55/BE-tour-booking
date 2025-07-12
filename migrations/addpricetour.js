'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Kiểm tra cột price có tồn tại không trước khi thêm
    const [columns] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tour_booking_db'}' 
      AND TABLE_NAME = 'tour' 
      AND COLUMN_NAME = 'price'
    `);
    
    if (columns.length === 0) {
      await queryInterface.addColumn('tour', 'price', {
        type: Sequelize.FLOAT,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tour', 'price');
  }
};
