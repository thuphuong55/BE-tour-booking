'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('booking', 'commission_rate', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Tỷ lệ hoa hồng admin (%) - VD: 15.00 = 15%'
    });

    await queryInterface.addColumn('booking', 'admin_commission', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Số tiền hoa hồng admin nhận được'
    });

    await queryInterface.addColumn('booking', 'agency_amount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Số tiền agency nhận được sau khi trừ hoa hồng'
    });

    await queryInterface.addColumn('booking', 'commission_calculated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Thời điểm tính hoa hồng'
    });

    // Tạo index để tăng hiệu suất truy vấn
    await queryInterface.addIndex('booking', ['commission_calculated_at']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('booking', ['commission_calculated_at']);
    await queryInterface.removeColumn('booking', 'commission_calculated_at');
    await queryInterface.removeColumn('booking', 'agency_amount');
    await queryInterface.removeColumn('booking', 'admin_commission');
    await queryInterface.removeColumn('booking', 'commission_rate');
  }
};
