const { Account } = require("../models");

const getSaldoByUserIdHandler = async (req, res) => {
  const user_id = req.user?.id;

  try {
    /**
     * =========================
     * VALIDASI USER
     * =========================
     */

    if (!user_id) {
      return res.status(401).json({
        status: false,
        message: "User tidak terautentikasi.",
      });
    }

    /**
     * =========================
     * AMBIL SEMUA ACCOUNT USER
     * =========================
     */

    const accounts = await Account.findAll({
      where: {
        user_id,
      },

      attributes: [
        "id",
        "name",
        "saldo",
        "last_updated",
      ],

      order: [
        ["created_at", "ASC"],
      ],

      raw: true,
    });

    /**
     * =========================
     * CEK ACCOUNT
     * =========================
     */

    if (!accounts || accounts.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Tidak ada rekening ditemukan.",
      });
    }

    /**
     * =========================
     * FORMAT RESPONSE
     * =========================
     */

    const data = accounts.map((account) => ({
      account_id: account.id,

      account_name:
        account.name || "Tidak diketahui",

      saldo: Number(account.saldo),

      last_updated:
        account.last_updated,
    }));

    /**
     * =========================
     * RESPONSE
     * =========================
     */

    return res.status(200).json({
      status: true,
      message: "Data saldo berhasil diambil",
      data,
    });
  } catch (error) {
    console.error(
      "Get Saldo Error:",
      error,
    );

    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan server",
      error: error.message,
    });
  }
};

module.exports = getSaldoByUserIdHandler;