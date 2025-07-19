'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('hotels', 'location_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'location',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Tạo index cho location_id để tăng hiệu suất truy vấn
    await queryInterface.addIndex('hotels', ['location_id']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('hotels', ['location_id']);
    await queryInterface.removeColumn('hotels', 'location_id');
  }
};
