const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Finance = sequelize.define(
  "Finance",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
  },
  {
    tableName: "finance",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

module.exports = Finance;
