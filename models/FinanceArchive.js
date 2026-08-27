const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FinanceArchive = sequelize.define(
    "FinanceArchive",
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
        },

        account_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },

        transfer_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },

        amount: {
            type: DataTypes.DECIMAL,
            allowNull: false,

            validate: {
                min: 0.01,
            },
        },

        mutation_type: {
            type: DataTypes.ENUM("masuk", "keluar"),
            allowNull: false,
        },

        transaction_type: {
            type: DataTypes.ENUM("income", "expense", "transfer"),
            allowNull: false,
        },

        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },

        archived_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: "finance_archive",

        timestamps: false,

        indexes: [
            {
                name: "idx_finance_archive_account_created_at",
                fields: [
                    "account_id",
                    {
                        name: "created_at",
                        order: "DESC",
                    },
                ],
            },

            {
                name: "idx_finance_archive_transfer_id",
                fields: ["transfer_id"],
            },
        ],
    },
);

module.exports = FinanceArchive;