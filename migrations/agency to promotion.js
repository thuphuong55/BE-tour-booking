// migrations/xxxx-add-agency-id-to-promotion.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('promotion', 'agency_id', {
      type: Sequelize.UUID,
      allowNull: false
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('promotion', 'agency_id');
  }
};