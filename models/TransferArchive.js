const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TransferArchive = sequelize.define(
    "TransferArchive",
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
        },

        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },

        from_account_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },

        to_account_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },

        amount: {
            type: DataTypes.DECIMAL,
            allowNull: false,

            validate: {
                min: 0.01,
            },
        },

        deskripsi: {
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
        tableName: "transfers_archive",

        timestamps: false,

        indexes: [
            {
                name: "idx_transfers_archive_user_created_at",
                fields: [
                    "user_id",
                    {
                        name: "created_at",
                        order: "DESC",
                    },
                ],
            },
        ],
    },
);

module.exports = TransferArchive;