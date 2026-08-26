const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Transfer = sequelize.define(
  "Transfer",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
  },
  {
    tableName: "transfers",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: false,
  },
);

module.exports = Transfer;
