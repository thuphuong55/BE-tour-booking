'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('promotion', 'discount_amount', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Promotions', 'discount_amount', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  }
};
