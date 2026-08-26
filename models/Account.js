const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Account = sequelize.define(
  "Account",
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

    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    saldo: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0,

      validate: {
        min: 0,
      },
    },

    last_updated: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "accounts",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: "last_updated",
  },
);

module.exports = Account;
