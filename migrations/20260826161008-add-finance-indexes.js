// migrations\20260826161008-add-finance-indexes.js
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_finance_account_created_at
      ON finance (account_id, created_at);
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_finance_account_transaction_created
      ON finance (account_id, transaction_type, created_at);
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_finance_transfer_id
      ON finance (transfer_id);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_finance_account_created_at;
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_finance_account_transaction_created;
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_finance_transfer_id;
    `);
  },
};
