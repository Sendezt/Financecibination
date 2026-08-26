// migrations\20260826161008-add-finance-indexes.js
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ============================
    // ACCOUNTS
    // ============================

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id
      ON accounts (user_id);
    `);

    // ============================
    // TRANSFERS
    // ============================

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transfers_user_created_at
      ON transfers (user_id, created_at);
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transfers_from_account_id
      ON transfers (from_account_id);
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transfers_to_account_id
      ON transfers (to_account_id);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_accounts_user_id;
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_transfers_user_created_at;
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_transfers_from_account_id;
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_transfers_to_account_id;
    `);
  },
};
