module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Kiểm tra cột tour_schedule_id có tồn tại không trước khi xóa
    const [columns1] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tour_booking_db'}' 
      AND TABLE_NAME = 'booking' 
      AND COLUMN_NAME = 'tour_schedule_id'
    `);
    if (columns1.length > 0) {
      await queryInterface.removeColumn('booking', 'tour_schedule_id');
    }
    // Kiểm tra cột tour_id đã tồn tại chưa trước khi thêm
    const [columns2] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tour_booking_db'}' 
      AND TABLE_NAME = 'booking' 
      AND COLUMN_NAME = 'tour_id'
    `);
    if (columns2.length === 0) {
      await queryInterface.addColumn('booking', 'tour_id', {
        type: Sequelize.UUID,
        allowNull: false,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('booking', 'tour_id');
    await queryInterface.addColumn('booking', 'tour_schedule_id', {
      type: Sequelize.UUID,
      allowNull: false,
    });
  }
};
