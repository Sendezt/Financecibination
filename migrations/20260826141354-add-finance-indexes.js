// migrations/20260826141354-add-finance-indexes.js
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Membuat indeks hanya jika belum ada (IF NOT EXISTS)
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_finance_account_created_at 
      ON finance (account_id, created_at DESC);
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_finance_account_transaction_created 
      ON finance (account_id, transaction_type, created_at DESC);
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_finance_transfer_id 
      ON finance (transfer_id);
    `);
  },

  async down(queryInterface, Sequelize) {
    // Menghapus indeks hanya jika ada (IF EXISTS)
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