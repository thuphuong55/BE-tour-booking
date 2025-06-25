module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("booking", "departure_date_id", {
      type: Sequelize.UUID,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("booking", "departure_date_id");
  },
};
// This migration adds the departure_date_id column to the booking table.