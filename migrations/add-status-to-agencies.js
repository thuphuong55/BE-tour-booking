module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("agency", "status", {
      type: Sequelize.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("agency", "status");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS 'enum_agency_status';");
  },
};