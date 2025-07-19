'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('commission_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      commission_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 15.00,
        comment: 'Tỷ lệ hoa hồng admin (%) - VD: 15.00 = 15%'
      },
      min_booking_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Giá trị booking tối thiểu để áp dụng tỷ lệ này'
      },
      max_booking_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Giá trị booking tối đa để áp dụng tỷ lệ này'
      },
      tour_category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tour_category',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Áp dụng cho danh mục tour cụ thể (null = áp dụng chung)'
      },
      effective_from: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Ngày bắt đầu có hiệu lực'
      },
      effective_to: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Ngày kết thúc hiệu lực'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Tạo indexes
    await queryInterface.addIndex('commission_settings', ['user_id']);
    await queryInterface.addIndex('commission_settings', ['tour_category_id']);
    await queryInterface.addIndex('commission_settings', ['effective_from', 'effective_to']);
    await queryInterface.addIndex('commission_settings', ['is_active']);

    // Thêm constraint để đảm bảo logic
    await queryInterface.addConstraint('commission_settings', {
      fields: ['min_booking_value', 'max_booking_value'],
      type: 'check',
      name: 'check_booking_value_range',
      where: {
        [Sequelize.Op.or]: [
          { min_booking_value: null },
          { max_booking_value: null },
          { min_booking_value: { [Sequelize.Op.lte]: Sequelize.col('max_booking_value') } }
        ]
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('commission_settings', 'check_booking_value_range');
    await queryInterface.removeIndex('commission_settings', ['is_active']);
    await queryInterface.removeIndex('commission_settings', ['effective_from', 'effective_to']);
    await queryInterface.removeIndex('commission_settings', ['tour_category_id']);
    await queryInterface.removeIndex('commission_settings', ['user_id']);
    await queryInterface.dropTable('commission_settings');
  }
};
