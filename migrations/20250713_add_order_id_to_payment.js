module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('payment', 'order_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('payment', 'order_id');
  },
};
