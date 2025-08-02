'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Thêm các cột mới cho FAQ chat
    await queryInterface.addColumn('faq', 'category', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Phân loại FAQ: booking, tour, payment, general'
    });

    await queryInterface.addColumn('faq', 'keywords', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Keywords để search FAQ'
    });

    await queryInterface.addColumn('faq', 'order_priority', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'Thứ tự ưu tiên hiển thị'
    });

    await queryInterface.addColumn('faq', 'is_active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      comment: 'FAQ có đang active không'
    });

    await queryInterface.addColumn('faq', 'view_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'Số lần FAQ được xem'
    });

    // Thêm timestamps nếu chưa có
    await queryInterface.addColumn('faq', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    await queryInterface.addColumn('faq', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    // Tạo index cho search performance
    await queryInterface.addIndex('faq', ['category']);
    await queryInterface.addIndex('faq', ['is_active']);
    await queryInterface.addIndex('faq', ['order_priority']);
  },

  async down(queryInterface, Sequelize) {
    // Xóa các cột đã thêm
    await queryInterface.removeColumn('faq', 'category');
    await queryInterface.removeColumn('faq', 'keywords');
    await queryInterface.removeColumn('faq', 'order_priority');
    await queryInterface.removeColumn('faq', 'is_active');
    await queryInterface.removeColumn('faq', 'view_count');
    await queryInterface.removeColumn('faq', 'created_at');
    await queryInterface.removeColumn('faq', 'updated_at');
  }
};
