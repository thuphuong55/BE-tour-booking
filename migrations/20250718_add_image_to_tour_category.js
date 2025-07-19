'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tour_category', 'image', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'URL ảnh đại diện cho category'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tour_category', 'image');
  }
};
