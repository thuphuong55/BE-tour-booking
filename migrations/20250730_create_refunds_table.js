'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refunds', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      bookingId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'booking_id',
        comment: 'ID của booking cần hoàn tiền'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'user_id',
        comment: 'ID của user yêu cầu hoàn tiền'
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Số tiền hoàn lại'
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Trạng thái hoàn tiền: pending, approved, rejected, completed'
      },
      reason: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Lý do hoàn tiền'
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'processed_at',
        comment: 'Thời gian xử lý hoàn tiền'
      },
      processed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'processed_by',
        comment: 'Admin/User ID đã xử lý'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Thêm indexes cho performance
    await queryInterface.addIndex('refunds', ['booking_id']);
    await queryInterface.addIndex('refunds', ['user_id']);
    await queryInterface.addIndex('refunds', ['status']);
    await queryInterface.addIndex('refunds', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('refunds');
  }
};
