const { Account, Finance } = require("../models");
const { Op, fn, col } = require("sequelize");
const { DateTime } = require("luxon");

const getNetCashflowBulananHandler = async (req, res) => {
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
   * TENTUKAN BULAN & TAHUN
   * (Default ke bulan/tahun saat ini jika tidak diisi)
   * ==========================
   */
  const nowJakarta = DateTime.now().setZone("Asia/Jakarta");
  const monthNumber = month !== undefined ? Number(month) : nowJakarta.month;
  const yearNumber = year !== undefined ? Number(year) : nowJakarta.year;

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
     * PERIODE BULAN SAAT INI (UTC)
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
     * PERIODE BULAN SEBELUMNYA (UTC)
     * ==========================
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
      attributes: ["id", "name", "saldo"],
      order: [["created_at", "ASC"]],
      raw: true,
    });

    /**
     * ==========================
     * JIKA BELUM MEMILIKI ACCOUNT
     * ==========================
     */
    if (accounts.length === 0) {
      return res.status(200).json({
        status: true,
        message: "Data net cashflow saldo bulanan berhasil diambil",
        user_id,
        bulan: monthNumber,
        tahun: yearNumber,
        total_saldo: 0,
        total_pemasukan: 0,
        total_pengeluaran: 0,
        net_cashflow: 0,
        status_cashflow: "seimbang",
        data: [],
        perbandingan_bulan_lalu: {
          total_pemasukan_bulan_lalu: 0,
          total_pengeluaran_bulan_lalu: 0,
          net_cashflow_bulan_lalu: 0,
          selisih_net_cashflow: 0,
          persentase_perubahan: 0,
          status: "tetap",
        },
      });
    }

    const accountIds = accounts.map((account) => account.id);

    /**
     * ==========================
     * QUERY AGREGASI PEMASUKAN & PENGELUARAN
     * (Bulan ini & bulan sebelumnya paralel)
     * ==========================
     */
    const [currentMonthFinance, lastMonthFinance] = await Promise.all([
      Finance.findAll({
        where: {
          account_id: {
            [Op.in]: accountIds,
          },
          transaction_type: {
            [Op.in]: ["income", "expense"],
          },
          created_at: {
            [Op.gte]: startDate,
            [Op.lt]: endDate,
          },
        },
        attributes: [
          "account_id",
          "transaction_type",
          [fn("SUM", col("amount")), "total_amount"],
        ],
        group: ["account_id", "transaction_type"],
        raw: true,
      }),

      Finance.findAll({
        where: {
          account_id: {
            [Op.in]: accountIds,
          },
          transaction_type: {
            [Op.in]: ["income", "expense"],
          },
          created_at: {
            [Op.gte]: lastMonthStartDate,
            [Op.lt]: lastMonthEndDate,
          },
        },
        attributes: [
          "transaction_type",
          [fn("SUM", col("amount")), "total_amount"],
        ],
        group: ["transaction_type"],
        raw: true,
      }),
    ]);

    /**
     * ==========================
     * MAP TRANSAKSI PER ACCOUNT
     * ==========================
     */
    const incomeMap = {};
    const expenseMap = {};

    for (const item of currentMonthFinance) {
      const amount = Number(item.total_amount) || 0;
      if (item.transaction_type === "income") {
        incomeMap[item.account_id] = (incomeMap[item.account_id] || 0) + amount;
      } else if (item.transaction_type === "expense") {
        expenseMap[item.account_id] = (expenseMap[item.account_id] || 0) + amount;
      }
    }

    /**
     * ==========================
     * FORMAT DATA PER REKENING
     * ==========================
     */
    const data = accounts.map((account) => {
      const total_pemasukan = incomeMap[account.id] || 0;
      const total_pengeluaran = expenseMap[account.id] || 0;
      const net_cashflow = total_pemasukan - total_pengeluaran;
      const saldo = Number(account.saldo) || 0;

      let status_cashflow = "seimbang";
      if (net_cashflow > 0) {
        status_cashflow = "surplus";
      } else if (net_cashflow < 0) {
        status_cashflow = "defisit";
      }

      return {
        account_id: account.id,
        nama_rekening: account.name,
        saldo,
        total_pemasukan,
        total_pengeluaran,
        net_cashflow,
        status_cashflow,
      };
    });

    /**
     * ==========================
     * TOTAL KESELURUHAN USER
     * ==========================
     */
    const total_saldo = accounts.reduce(
      (sum, acc) => sum + (Number(acc.saldo) || 0),
      0
    );

    const total_pemasukan = data.reduce(
      (sum, item) => sum + item.total_pemasukan,
      0
    );

    const total_pengeluaran = data.reduce(
      (sum, item) => sum + item.total_pengeluaran,
      0
    );

    const net_cashflow = total_pemasukan - total_pengeluaran;

    let status_cashflow = "seimbang";
    if (net_cashflow > 0) {
      status_cashflow = "surplus";
    } else if (net_cashflow < 0) {
      status_cashflow = "defisit";
    }

    /**
     * ==========================
     * TOTAL BULAN LALU & PERBANDINGAN
     * ==========================
     */
    let total_pemasukan_bulan_lalu = 0;
    let total_pengeluaran_bulan_lalu = 0;

    for (const item of lastMonthFinance) {
      const amount = Number(item.total_amount) || 0;
      if (item.transaction_type === "income") {
        total_pemasukan_bulan_lalu += amount;
      } else if (item.transaction_type === "expense") {
        total_pengeluaran_bulan_lalu += amount;
      }
    }

    const net_cashflow_bulan_lalu =
      total_pemasukan_bulan_lalu - total_pengeluaran_bulan_lalu;

    const selisih_net_cashflow = net_cashflow - net_cashflow_bulan_lalu;

    let persentase_perubahan = null;
    if (net_cashflow_bulan_lalu !== 0) {
      persentase_perubahan = Number(
        ((selisih_net_cashflow / Math.abs(net_cashflow_bulan_lalu)) * 100).toFixed(2)
      );
    }

    let status_perbandingan = "tetap";
    if (selisih_net_cashflow > 0) {
      status_perbandingan = "naik";
    } else if (selisih_net_cashflow < 0) {
      status_perbandingan = "turun";
    }

    /**
     * ==========================
     * RESPONSE
     * ==========================
     */
    return res.status(200).json({
      status: true,
      message: "Data net cashflow saldo bulanan berhasil diambil",
      user_id,
      bulan: monthNumber,
      tahun: yearNumber,
      total_saldo,
      total_pemasukan,
      total_pengeluaran,
      net_cashflow,
      status_cashflow,
      data,
      perbandingan_bulan_lalu: {
        total_pemasukan_bulan_lalu,
        total_pengeluaran_bulan_lalu,
        net_cashflow_bulan_lalu,
        selisih_net_cashflow,
        persentase_perubahan,
        status: status_perbandingan,
      },
    });
  } catch (error) {
    console.error("Get Net Cashflow Bulanan Error:", error);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

module.exports = getNetCashflowBulananHandler;
