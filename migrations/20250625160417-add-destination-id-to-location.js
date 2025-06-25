"use strict";

module.exports = {
  // chạy khi migrate
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("location", "destination_id", {
      type: Sequelize.UUID,
      allowNull: true,          // ← nếu bảng location đang có data cũ, tạm đặt true
      references: {
        model: "destination",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },

  // chạy khi undo
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("location", "destination_id");
  },
};
