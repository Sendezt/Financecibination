// migrations\20260826140026-update-finance-add-transaction-type-and-transfer-id.js
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "finance";

    // Dapatkan daftar kolom yang sudah ada di tabel finance
    const tableDescription = await queryInterface.describeTable(tableName);
    const existingColumns = Object.keys(tableDescription);

    // 1. Tambahkan transaction_type jika belum ada
    if (!existingColumns.includes("transaction_type")) {
      await queryInterface.addColumn(tableName, "transaction_type", {
        type: Sequelize.ENUM("income", "expense", "transfer"),
        allowNull: true,
      });
      console.log("Kolom transaction_type berhasil ditambahkan.");
    } else {
      console.log("Kolom transaction_type sudah ada, dilewati.");
    }

    // 2. Tambahkan transfer_id jika belum ada
    if (!existingColumns.includes("transfer_id")) {
      await queryInterface.addColumn(tableName, "transfer_id", {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "transfers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
      console.log("Kolom transfer_id berhasil ditambahkan.");
    } else {
      console.log("Kolom transfer_id sudah ada, dilewati.");
    }
  },

  async down(queryInterface, Sequelize) {
    const tableName = "finance";

    // Hapus kolom hanya jika ada (untuk rollback yang aman)
    const tableDescription = await queryInterface.describeTable(tableName);
    const existingColumns = Object.keys(tableDescription);

    if (existingColumns.includes("transfer_id")) {
      await queryInterface.removeColumn(tableName, "transfer_id");
    }

    if (existingColumns.includes("transaction_type")) {
      await queryInterface.removeColumn(tableName, "transaction_type");
    }
  },
};