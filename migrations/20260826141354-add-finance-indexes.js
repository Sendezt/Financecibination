"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Query mutasi berdasarkan rekening dan tanggal
    await queryInterface.addIndex("finance", ["account_id", "created_at"], {
      name: "idx_finance_account_created_at",
    });

    // Query income/expense berdasarkan rekening dan tanggal
    await queryInterface.addIndex(
      "finance",
      ["account_id", "transaction_type", "created_at"],
      {
        name: "idx_finance_account_transaction_created",
      },
    );

    // Mencari mutasi yang berasal dari transfer
    await queryInterface.addIndex("finance", ["transfer_id"], {
      name: "idx_finance_transfer_id",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      "finance",
      "idx_finance_account_created_at",
    );

    await queryInterface.removeIndex(
      "finance",
      "idx_finance_account_transaction_created",
    );

    await queryInterface.removeIndex("finance", "idx_finance_transfer_id");
  },
};
