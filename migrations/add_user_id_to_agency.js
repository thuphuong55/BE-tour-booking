"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("agency", "user_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("agency", "user_id");
  }
}; 