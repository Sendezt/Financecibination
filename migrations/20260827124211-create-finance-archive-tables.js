'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ==========================================
    // 1. CREATE TABLE FINANCE_ARCHIVE
    // ==========================================

    await queryInterface.createTable("finance_archive", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },

      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      transfer_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },

      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },

      mutation_type: {
        type: "mutation_type_enum",
        allowNull: false,
      },

      transaction_type: {
        type: "transaction_type_enum",
        allowNull: false,
      },

      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      archived_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    // Foreign Key account_id
    await queryInterface.addConstraint("finance_archive", {
      fields: ["account_id"],
      type: "foreign key",
      name: "fk_finance_archive_account",
      references: {
        table: "accounts",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // ==========================================
    // INDEX FINANCE_ARCHIVE
    // ==========================================

    await queryInterface.addIndex("finance_archive", ["account_id", "created_at"], {
      name: "idx_finance_archive_account_created_at",
    });

    await queryInterface.addIndex("finance_archive", ["transfer_id"], {
      name: "idx_finance_archive_transfer_id",
    });

    // ==========================================
    // 2. CREATE TABLE TRANSFERS_ARCHIVE
    // ==========================================

    await queryInterface.createTable("transfers_archive", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      from_account_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      to_account_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },

      deskripsi: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      archived_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    // Foreign Key user_id
    await queryInterface.addConstraint("transfers_archive", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_transfers_archive_user",
      references: {
        table: "pengguna",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Foreign Key from_account_id
    await queryInterface.addConstraint("transfers_archive", {
      fields: ["from_account_id"],
      type: "foreign key",
      name: "fk_transfers_archive_from_account",
      references: {
        table: "accounts",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Foreign Key to_account_id
    await queryInterface.addConstraint("transfers_archive", {
      fields: ["to_account_id"],
      type: "foreign key",
      name: "fk_transfers_archive_to_account",
      references: {
        table: "accounts",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // ==========================================
    // INDEX TRANSFERS_ARCHIVE
    // ==========================================

    await queryInterface.addIndex(
      "transfers_archive",
      ["user_id", "created_at"],
      {
        name: "idx_transfers_archive_user_created_at",
      },
    );

    // ==========================================
    // 3. CREATE TABLE DAILY_FINANCE_SUMMARY
    // ==========================================

    await queryInterface.createTable("daily_finance_summary", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      total_income: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },

      total_expense: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
      },

      total_transaction: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    // Foreign Key user_id
    await queryInterface.addConstraint("daily_finance_summary", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_daily_finance_summary_user",
      references: {
        table: "pengguna",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // UNIQUE user_id + date
    await queryInterface.addConstraint("daily_finance_summary", {
      fields: ["user_id", "date"],
      type: "unique",
      name: "unique_daily_finance_summary_user_date",
    });

    // INDEX untuk histori summary
    await queryInterface.addIndex(
      "daily_finance_summary",
      ["user_id", "date"],
      {
        name: "idx_daily_finance_summary_user_date",
      },
    );
  },

  async down(queryInterface, Sequelize) {
    // Drop tabel dalam urutan terbalik

    await queryInterface.dropTable("daily_finance_summary");

    await queryInterface.dropTable("transfers_archive");

    await queryInterface.dropTable("finance_archive");
  }
};
