// Migration: Thêm ràng buộc khóa ngoại tour_id cho bảng booking
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Đảm bảo cột tour_id đã tồn tại và kiểu UUID
    await queryInterface.changeColumn('booking', 'tour_id', {
      type: Sequelize.UUID,
      allowNull: false,
    });
    // Thêm ràng buộc khóa ngoại
    await queryInterface.addConstraint('booking', {
      fields: ['tour_id'],
      type: 'foreign key',
      name: 'fk_booking_tour_id',
      references: {
        table: 'tour',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('booking', 'fk_booking_tour_id');
  }
};
