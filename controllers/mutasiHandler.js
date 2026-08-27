const { Account, Finance } = require("../models");
const { DateTime } = require("luxon");
const { Op } = require("sequelize");

const mutasiMingguanHandler = async (req, res) => {
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
     * AMBIL ACCOUNT MILIK USER
     * =========================
     */

    const accounts = await Account.findAll({
      where: {
        user_id,
      },
      attributes: ["id", "name"],
      raw: true,
    });

    if (!accounts || accounts.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Tidak ada rekening ditemukan",
      });
    }

    /**
     * =========================
     * AMBIL ID ACCOUNT
     * =========================
     */

    const accountIds = accounts.map(
      (account) => account.id,
    );

    /**
     * =========================
     * TENTUKAN 7 HARI TERAKHIR
     * =========================
     */

    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 7,
    );

    /**
     * =========================
     * AMBIL DATA MUTASI
     * =========================
     */

    const finance = await Finance.findAll({
      where: {
        account_id: {
          [Op.in]: accountIds,
        },

        created_at: {
          [Op.gte]: sevenDaysAgo,
        },
      },

      include: [
        {
          model: Account,
          as: "account",
          attributes: ["name"],
        },
      ],

      order: [
        ["created_at", "DESC"],
      ],
    });

    /**
     * =========================
     * FORMAT RESPONSE
     * =========================
     */

    const dataWithAccountNames = finance.map(
      (item) => ({
        id: item.id,

        account_id: item.account_id,

        account_name:
          item.account?.name || "Tidak diketahui",

        amount: item.amount,

        mutation_type: item.mutation_type,

        transaction_type:
          item.transaction_type,

        transfer_id: item.transfer_id,

        note: item.note,

        created_at: item.created_at,

        date_indonesia: DateTime
          .fromJSDate(item.created_at, {
            zone: "utc",
          })
          .setZone("Asia/Jakarta")
          .toFormat("yyyy-MM-dd HH:mm:ss"),
      }),
    );

    /**
     * =========================
     * RESPONSE
     * =========================
     */

    return res.status(200).json({
      status: true,
      message: "Data mutasi 7 hari terakhir",
      data: dataWithAccountNames,
    });
  } catch (error) {
    console.error(
      "Get Mutasi Mingguan Error:",
      error,
    );

    return res.status(500).json({
      status: false,
      message: "Gagal mengambil data mutasi",
      error: error.message,
    });
  }
};

module.exports = mutasiMingguanHandler;