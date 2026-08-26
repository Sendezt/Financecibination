"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tambahkan transaction_type
    await queryInterface.addColumn("finance", "transaction_type", {
      type: Sequelize.ENUM("income", "expense", "transfer"),
      allowNull: true,
    });

    // 2. Tambahkan transfer_id
    await queryInterface.addColumn("finance", "transfer_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "transfers",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    // Hapus foreign key/column transfer_id
    await queryInterface.removeColumn("finance", "transfer_id");

    // Hapus column transaction_type
    await queryInterface.removeColumn("finance", "transaction_type");

    // Hapus ENUM PostgreSQL
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_finance_transaction_type";',
    );
  },
};
