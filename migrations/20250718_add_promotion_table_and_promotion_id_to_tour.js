module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tạo bảng promotion
    await queryInterface.createTable('promotion', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      discount_amount: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Thêm cột promotion_id vào bảng tour
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
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa cột promotion_id khỏi bảng tour
    await queryInterface.removeColumn('tour', 'promotion_id');
    // Xóa bảng promotion
    await queryInterface.dropTable('promotion');
  }
};
