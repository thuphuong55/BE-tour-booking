"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("destination", "location_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "location",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("destination", "location_id");
  }
}; 