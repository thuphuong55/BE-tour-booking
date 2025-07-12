'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Kiểm tra cột price có tồn tại không trước khi xóa
    const [columns] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tour_booking_db'}' 
      AND TABLE_NAME = 'departure_date' 
      AND COLUMN_NAME = 'price'
    `);
    
    if (columns.length > 0) {
      await queryInterface.removeColumn('departure_date', 'price');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('departure_date', 'price', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
  }
};
