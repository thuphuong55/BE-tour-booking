module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Agencies", "status", {
      type: Sequelize.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Agencies", "status");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_Agencies_status\";");
  },
};