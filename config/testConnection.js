const sequelize = require("./database");

async function testConnection() {
  try {
    await sequelize.authenticate();

    console.log("Database PostgreSQL berhasil terhubung.");
  } catch (error) {
    console.error("Gagal terhubung ke database:", error);
  }
}

testConnection();
