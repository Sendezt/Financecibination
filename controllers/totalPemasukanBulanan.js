const { Account, Finance } = require("../models");
const { Op, fn, col } = require("sequelize");

const getPemasukanByUserHandler = async (req, res) => {
  const { month, year } = req.query;
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(401).json({
      status: false,
      message: "User tidak terautentikasi.",
    });
  }

  if (!month || !year) {
    return res.status(400).json({
      status: false,
      message: "Month dan year wajib diisi.",
    });
  }

  const monthNumber = Number(month);
  const yearNumber = Number(year);

  // Validasi bulan
  if (
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    return res.status(400).json({
      status: false,
      message: "Month harus bernilai antara 1 sampai 12.",
    });
  }

  if (
    !Number.isInteger(yearNumber) ||
    yearNumber < 2000
  ) {
    return res.status(400).json({
      status: false,
      message: "Year tidak valid.",
    });
  }

  try {
    /**
     * ==========================
     * BULAN SAAT INI
     * ==========================
     */

    const startDate = new Date(
      Date.UTC(yearNumber, monthNumber - 1, 1)
    );

    const endDate = new Date(
      Date.UTC(yearNumber, monthNumber, 1)
    );

    /**
     * ==========================
     * BULAN SEBELUMNYA
     * ==========================
     *
     * Date.UTC otomatis menangani
     * kasus Januari -> Desember tahun sebelumnya.
     */

    const lastMonthStartDate = new Date(
      Date.UTC(yearNumber, monthNumber - 2, 1)
    );

    const lastMonthEndDate = new Date(
      Date.UTC(yearNumber, monthNumber - 1, 1)
    );

    /**
     * ==========================
     * AMBIL ACCOUNT USER
     * ==========================
     */

    const accounts = await Account.findAll({
      where: {
        user_id,
      },
      attributes: ["id", "name"],
      raw: true,
    });

    if (accounts.length === 0) {
      return res.status(200).json({
        status: true,
        user_id,
        bulan: monthNumber,
        tahun: yearNumber,

        data: [],

        total_pemasukan_user: 0,

        perbandingan_bulan_lalu: {
          total_pemasukan_bulan_lalu: 0,
          selisih: 0,
          persentase_perubahan: 0,
          status: "tetap",
        },
      });
    }

    const accountIds = accounts.map(
      (account) => account.id
    );

    /**
     * ==========================
     * PEMASUKAN BULAN SAAT INI
     * ==========================
     */

    const pemasukanData = await Finance.findAll({
      where: {
        account_id: {
          [Op.in]: accountIds,
        },

        transaction_type: "income",

        mutation_type: "masuk",

        created_at: {
          [Op.gte]: startDate,
          [Op.lt]: endDate,
        },
      },

      attributes: [
        "account_id",
        [
          fn("SUM", col("amount")),
          "total_pemasukan",
        ],
      ],

      group: ["account_id"],

      raw: true,
    });

    /**
     * ==========================
     * PEMASUKAN BULAN LALU
     * ==========================
     */

    const lastMonthPemasukanData = await Finance.findAll({
      where: {
        account_id: {
          [Op.in]: accountIds,
        },

        transaction_type: "income",

        mutation_type: "masuk",

        created_at: {
          [Op.gte]: lastMonthStartDate,
          [Op.lt]: lastMonthEndDate,
        },
      },

      attributes: [
        [
          fn("SUM", col("amount")),
          "total_pemasukan_bulan_lalu",
        ],
      ],

      raw: true,
    });

    /**
     * ==========================
     * MAP PEMASUKAN PER ACCOUNT
     * ==========================
     */

    const pemasukanMap = {};

    for (const item of pemasukanData) {
      pemasukanMap[item.account_id] =
        Number(item.total_pemasukan);
    }

    /**
     * ==========================
     * FORMAT DATA PER ACCOUNT
     * ==========================
     */

    const data = accounts.map((account) => ({
      account_id: account.id,
      nama_rekening: account.name,
      total_pemasukan:
        pemasukanMap[account.id] || 0,
    }));

    /**
     * ==========================
     * TOTAL PEMASUKAN BULAN INI
     * ==========================
     */

    const total_pemasukan_user = data.reduce(
      (total, account) =>
        total + account.total_pemasukan,
      0
    );

    /**
     * ==========================
     * TOTAL PEMASUKAN BULAN LALU
     * ==========================
     */

    const total_pemasukan_bulan_lalu = Number(
      lastMonthPemasukanData[0]
        ?.total_pemasukan_bulan_lalu || 0
    );

    /**
     * ==========================
     * HITUNG PERBANDINGAN
     * ==========================
     */

    const selisih =
      total_pemasukan_user -
      total_pemasukan_bulan_lalu;

    let persentase_perubahan = null;

    if (total_pemasukan_bulan_lalu > 0) {
      persentase_perubahan = Number(((selisih / total_pemasukan_bulan_lalu) * 100).toFixed(2));
    }

    /**
     * ==========================
     * STATUS PERUBAHAN
     * ==========================
     */

    let status = "tetap";

    if (selisih > 0) {
      status = "naik";
    } else if (selisih < 0) {
      status = "turun";
    }

    /**
     * ==========================
     * RESPONSE
     * ==========================
     */

    return res.status(200).json({
      status: true,

      user_id,

      bulan: monthNumber,

      tahun: yearNumber,

      data,

      total_pemasukan_user,

      perbandingan_bulan_lalu: {
        total_pemasukan_bulan_lalu,

        selisih,

        persentase_perubahan,

        status,
      },
    });

  } catch (err) {
    console.error(
      "Get Pemasukan Bulanan Error:",
      err
    );

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

module.exports = getPemasukanByUserHandler;