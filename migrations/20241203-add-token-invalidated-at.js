'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'token_invalidated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Timestamp when user tokens were invalidated (for security)'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'token_invalidated_at');
  }
};
