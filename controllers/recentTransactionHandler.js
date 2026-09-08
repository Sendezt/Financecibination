const { Account, Finance } = require("../models");
const { Op } = require("sequelize");

const recentTransactionHandler = async (req, res) => {
  const user_id = req.user?.id;

  try {
    /**
     * VALIDASI USER
     */
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
    }

    // AMBIL REKENING MILIK USER
    const accounts = await Account.findAll({
      where: { user_id },
      attributes: ["id"],
      raw: true,
    });

    // JIKA USER BELUM MEMILIKI REKENING
    if (accounts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Data transaksi terbaru berhasil diambil",
        data: [],
        meta: {
          total: 0,
        },
      });
    }

    // AMBIL ID SEMUA REKENING
    const accountIds = accounts.map((account) => account.id);

    // AMBIL 5 TRANSAKSI TERBARU
    const finance = await Finance.findAll({
      where: {
        account_id: {
          [Op.in]: accountIds,
        },
      },

      include: [
        {
          model: Account,
          as: "account",
          attributes: ["id", "name"],
        },
      ],

      order: [["created_at", "DESC"]],

      limit: 5,
    });

    // FORMAT DATA RESPONSE
    const data = finance.map((item) => ({
      id: item.id,

      account: {
        id: item.account_id,
        name: item.account?.name || "Tidak diketahui",
      },

      amount: item.amount,

      mutation_type: item.mutation_type,

      transaction_type: item.transaction_type,

      transfer_id: item.transfer_id,

      note: item.note,

      created_at: item.created_at,
    }));

    // RESPONSE
    return res.status(200).json({
      success: true,

      message: "Data 5 transaksi terbaru berhasil diambil",

      data,

      meta: {
        total: data.length,
      },
    });
  } catch (error) {
    // Log lengkap hanya di backend
    console.error("Get Recent Transactions Error:", error);

    // Jangan kirim error.message ke production
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data transaksi terbaru",
    });
  }
};

module.exports = recentTransactionHandler;
