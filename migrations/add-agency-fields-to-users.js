"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Thêm cột status
    await queryInterface.addColumn("users", "status", {
      type: Sequelize.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "inactive",
    });

    // 2. Thêm cột temp_password_token
    await queryInterface.addColumn("users", "temp_password_token", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 3. Thêm cột name (nếu bạn chưa có)
    await queryInterface.addColumn("users", "name", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 4. Sửa ENUM role (thêm giá trị agency & admin nếu trước đây chưa có)
    // Với MySQL, ALTER ENUM đơn giản
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM("user", "agency", "admin"),
      allowNull: false,
      defaultValue: "user",
    });
  },

  async down(queryInterface, Sequelize) {
    // ⚠️ Thứ tự phải ngược lại khi xoá để tránh lỗi ràng buộc ENUM

    // 1. Trả ENUM role về chỉ còn 'user'
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM("user"),
      allowNull: false,
      defaultValue: "user",
    });

    // 2. Xoá cột name
    await queryInterface.removeColumn("users", "name");

    // 3. Xoá cột temp_password_token
    await queryInterface.removeColumn("users", "temp_password_token");

    // 4. Xoá cột status
    await queryInterface.removeColumn("users", "status");

    // 5. Dọn ENUM type thừa (MySQL tự xoá cùng cột; Postgres thì cần DROP TYPE — xem ghi chú)
  },
};
