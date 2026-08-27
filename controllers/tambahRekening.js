const { Account } = require("../models");

const addAccountHandler = async (req, res) => {
  const { name } = req.body;

  // Ambil user_id dari token JWT
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
        message: "User tidak terautentikasi",
      });
    }

    /**
     * =========================
     * VALIDASI NAMA REKENING
     * =========================
     */

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        status: false,
        message: "Nama rekening wajib diisi",
      });
    }

    const accountName = name.trim();

    if (!accountName) {
      return res.status(400).json({
        status: false,
        message: "Nama rekening tidak boleh kosong",
      });
    }

    /**
     * =========================
     * BUAT REKENING
     * =========================
     */

    const account = await Account.create({
      user_id,
      name: accountName,
    });

    /**
     * =========================
     * RESPONSE
     * =========================
     */

    return res.status(201).json({
      status: true,
      message: "Rekening berhasil ditambahkan",
      data: {
        id: account.id,
        account_name: account.name,
        saldo: account.saldo,
        created_at: account.created_at,
      },
    });
  } catch (error) {
    console.error("Add Account Error:", error);

    return res.status(500).json({
      status: false,
      message: "Gagal menambahkan rekening",
      error: error.message,
    });
  }
};

module.exports = addAccountHandler;