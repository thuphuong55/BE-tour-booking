'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('booking', 'number_of_adults', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
    await queryInterface.addColumn('booking', 'number_of_children', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('booking', 'number_of_adults');
    await queryInterface.removeColumn('booking', 'number_of_children');
  }
};
