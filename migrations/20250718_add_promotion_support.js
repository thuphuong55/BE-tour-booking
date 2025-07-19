'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Thêm promotion_id vào bảng tour
    await queryInterface.addColumn('tour', 'promotion_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'promotion',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Thêm các trường promotion vào bảng booking
    await queryInterface.addColumn('booking', 'promotion_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'promotion',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('booking', 'original_price', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true // Cho phép null để không ảnh hưởng đến dữ liệu cũ
    });

    await queryInterface.addColumn('booking', 'discount_amount', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0,
      allowNull: false
    });

    // Cập nhật original_price cho các booking cũ
    await queryInterface.sequelize.query(`
      UPDATE booking 
      SET original_price = total_price 
      WHERE original_price IS NULL
    `);

    // Sau khi cập nhật, đặt original_price thành NOT NULL
    await queryInterface.changeColumn('booking', 'original_price', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa các cột đã thêm
    await queryInterface.removeColumn('tour', 'promotion_id');
    await queryInterface.removeColumn('booking', 'promotion_id');
    await queryInterface.removeColumn('booking', 'original_price');
    await queryInterface.removeColumn('booking', 'discount_amount');
  }
};
