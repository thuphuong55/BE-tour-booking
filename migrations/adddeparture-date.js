'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('departure_date', 'price'); // 👈 tên bảng và tên cột
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('departure_date', 'price', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
  }
};
