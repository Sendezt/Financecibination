const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pengguna = sequelize.define(
  "Pengguna",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },

    password: {
      type: DataTypes.TEXT,
      allowNull: true, // nullable: user OAuth Google tidak punya password
    },

    full_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    role: {
      type: DataTypes.ENUM("admin", "user"),
      allowNull: false,
      defaultValue: "user",
    },

    wa_number: {
      type: DataTypes.TEXT,
      allowNull: true, // nullable: user Google mengisi WA lewat complete-profile
      unique: true,
    },

    google_id: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true,
    },

    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "pengguna",
    timestamps: true,

    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Pengguna;
