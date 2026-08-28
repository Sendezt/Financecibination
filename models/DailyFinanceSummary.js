const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DailyFinanceSummary = sequelize.define(
    "DailyFinanceSummary",
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
        },

        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },

        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        total_income: {
            type: DataTypes.DECIMAL,
            allowNull: false,
            defaultValue: 0,
        },

        total_expense: {
            type: DataTypes.DECIMAL,
            allowNull: false,
            defaultValue: 0,
        },

        total_transaction: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        tableName: "daily_finance_summary",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                name: "unique_daily_finance_summary_user_date",
                unique: true,
                fields: ["user_id", "date"],
            },
        ],
    },
);

module.exports = DailyFinanceSummary;