const { Account, Finance } = require("../models");
const { Op, fn, col } = require("sequelize");

const getPengeluaranByUserHandler = async (req, res) => {
  const { month, year } = req.query;
  const user_id = req.user?.id;

  /**
   * ==========================
   * VALIDASI USER
   * ==========================
   */

  if (!user_id) {
    return res.status(401).json({
      status: false,
      message: "User tidak terautentikasi.",
    });
  }

  /**
   * ==========================
   * VALIDASI MONTH & YEAR
   * ==========================
   */

  if (!month || !year) {
    return res.status(400).json({
      status: false,
      message: "Month dan year wajib diisi.",
    });
  }

  const monthNumber = Number(month);
  const yearNumber = Number(year);

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
     * PERIODE BULAN SAAT INI
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
     * PERIODE BULAN SEBELUMNYA
     * ==========================
     *
     * Contoh:
     * Januari 2026
     * ↓
     * Desember 2025
     */

    const lastMonthStartDate = new Date(
      Date.UTC(yearNumber, monthNumber - 2, 1)
    );

    const lastMonthEndDate = new Date(
      Date.UTC(yearNumber, monthNumber - 1, 1)
    );

    /**
     * ==========================
     * AMBIL SEMUA ACCOUNT USER
     * ==========================
     */

    const accounts = await Account.findAll({
      where: {
        user_id,
      },
      attributes: ["id", "name"],
      raw: true,
    });

    /**
     * ==========================
     * JIKA BELUM ADA ACCOUNT
     * ==========================
     */

    if (accounts.length === 0) {
      return res.status(200).json({
        status: true,
        user_id,
        bulan: monthNumber,
        tahun: yearNumber,

        data: [],

        total_pengeluaran_user: 0,

        perbandingan_bulan_lalu: {
          total_pengeluaran_bulan_lalu: 0,
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
     * QUERY PENGELUARAN
     * ==========================
     *
     * Jalankan bulan ini dan
     * bulan sebelumnya secara paralel.
     */

    const [
      pengeluaranData,
      lastMonthPengeluaranData,
    ] = await Promise.all([
      /**
       * PENGELUARAN BULAN INI
       */
      Finance.findAll({
        where: {
          account_id: {
            [Op.in]: accountIds,
          },

          transaction_type: "expense",

          mutation_type: "keluar",

          created_at: {
            [Op.gte]: startDate,
            [Op.lt]: endDate,
          },
        },

        attributes: [
          "account_id",
          [
            fn("SUM", col("amount")),
            "total_pengeluaran",
          ],
        ],

        group: ["account_id"],

        raw: true,
      }),

      /**
       * TOTAL PENGELUARAN
       * BULAN SEBELUMNYA
       */
      Finance.findAll({
        where: {
          account_id: {
            [Op.in]: accountIds,
          },

          transaction_type: "expense",

          mutation_type: "keluar",

          created_at: {
            [Op.gte]: lastMonthStartDate,
            [Op.lt]: lastMonthEndDate,
          },
        },

        attributes: [
          [
            fn("SUM", col("amount")),
            "total_pengeluaran_bulan_lalu",
          ],
        ],

        raw: true,
      }),
    ]);

    /**
     * ==========================
     * MAP PENGELUARAN PER ACCOUNT
     * ==========================
     */

    const pengeluaranMap = {};

    for (const item of pengeluaranData) {
      pengeluaranMap[item.account_id] =
        Number(item.total_pengeluaran);
    }

    /**
     * ==========================
     * FORMAT DATA PER ACCOUNT
     * ==========================
     */

    const data = accounts.map((account) => ({
      account_id: account.id,
      nama_rekening: account.name,

      total_pengeluaran:
        pengeluaranMap[account.id] || 0,
    }));

    /**
     * ==========================
     * TOTAL PENGELUARAN BULAN INI
     * ==========================
     */

    const total_pengeluaran_user = data.reduce(
      (total, account) =>
        total + account.total_pengeluaran,
      0
    );

    /**
     * ==========================
     * TOTAL BULAN LALU
     * ==========================
     */

    const total_pengeluaran_bulan_lalu = Number(
      lastMonthPengeluaranData[0]
        ?.total_pengeluaran_bulan_lalu || 0
    );

    /**
     * ==========================
     * HITUNG SELISIH
     * ==========================
     */

    const selisih =
      total_pengeluaran_user -
      total_pengeluaran_bulan_lalu;

    /**
     * ==========================
     * HITUNG PERSENTASE
     * ==========================
     */

    let persentase_perubahan = null;

    if (total_pengeluaran_bulan_lalu > 0) {
      persentase_perubahan =
        Number(((selisih / total_pengeluaran_bulan_lalu) * 100).toFixed(2));
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

      total_pengeluaran_user,

      perbandingan_bulan_lalu: {
        total_pengeluaran_bulan_lalu,

        selisih,

        persentase_perubahan,

        status,
      },
    });

  } catch (err) {
    console.error(
      "Get Pengeluaran Bulanan Error:",
      err
    );

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

module.exports = getPengeluaranByUserHandler;