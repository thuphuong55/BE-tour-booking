module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('booking', 'tour_schedule_id');
    await queryInterface.addColumn('booking', 'tour_id', {
      type: Sequelize.UUID,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('booking', 'tour_id');
    await queryInterface.addColumn('booking', 'tour_schedule_id', {
      type: Sequelize.UUID,
      allowNull: false,
    });
  }
};
