'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tạo bảng junction cho tour-location many-to-many relationship
    await queryInterface.createTable('tour_location', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      tour_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      location_id: {
        type: Sequelize.UUID,
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Tạo index cho hiệu suất
    await queryInterface.addIndex('tour_location', ['tour_id']);
    await queryInterface.addIndex('tour_location', ['location_id']);
    
    // Tạo unique constraint để tránh duplicate
    await queryInterface.addIndex('tour_location', ['tour_id', 'location_id'], {
      unique: true,
      name: 'unique_tour_location'
    });

    // Thêm foreign key constraints sau (nếu bảng tour và location đã tồn tại)
    try {
      await queryInterface.addConstraint('tour_location', {
        fields: ['tour_id'],
        type: 'foreign key',
        name: 'fk_tour_location_tour',
        references: {
          table: 'tour',
          field: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    } catch (e) {
      console.log('Không thể tạo foreign key constraint cho tour_id:', e.message);
    }

    try {
      await queryInterface.addConstraint('tour_location', {
        fields: ['location_id'],
        type: 'foreign key',
        name: 'fk_tour_location_location',
        references: {
          table: 'location',
          field: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    } catch (e) {
      console.log('Không thể tạo foreign key constraint cho location_id:', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tour_location');
  }
};
