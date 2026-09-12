const { Account, Finance } = require("../models");
const { DateTime } = require("luxon");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

/**
 * KONFIGURASI RENTANG WAKTU YANG DIIZINKAN
 * (sama dengan mutasiHandler)
 */
const ALLOWED_RANGES = {
  "7d": { days: 6 },
  "1m": { months: 1 },
  "3m": { months: 3 },
};

const RANGE_LABELS = {
  "7d": "7 hari",
  "1m": "1 bulan",
  "3m": "3 bulan",
};

/**
 * GET /api/mutasi/summary
 *
 * Mengembalikan data ringkasan untuk 3 card:
 *   1. Total Pemasukan  — jumlah nominal + jumlah mutasi masuk
 *   2. Total Pengeluaran — jumlah nominal + jumlah mutasi keluar
 *   3. Net Mutasi Periode — selisih (pemasukan − pengeluaran) + status surplus/defisit
 *
 * Query params:
 *   - range: "7d" | "1m" | "3m" (default: "7d")
 */
const mutasiSummaryHandler = async (req, res) => {
  const user_id = req.user?.id;

  try {
    // ── VALIDASI USER ──
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
    }

    // ── PARSING QUERY PARAMS ──
    const range = ALLOWED_RANGES[req.query.range]
      ? req.query.range
      : "7d";

    // ── AMBIL REKENING MILIK USER ──
    const accounts = await Account.findAll({
      where: { user_id },
      attributes: ["id"],
      raw: true,
    });

    // Jika user belum punya rekening → kembalikan semua 0
    if (accounts.length === 0) {
      return res.status(200).json({
        success: true,
        message: `Ringkasan mutasi ${RANGE_LABELS[range]} terakhir berhasil diambil`,
        data: {
          total_pemasukan: {
            amount: 0,
            count: 0,
          },
          total_pengeluaran: {
            amount: 0,
            count: 0,
          },
          net_mutasi: {
            amount: 0,
            status: "netral",
          },
        },
        meta: {
          period: {
            range,
            from: null,
            to: null,
          },
        },
      });
    }

    const accountIds = accounts.map((a) => a.id);

    // ── TENTUKAN PERIODE ──
    const now = DateTime.now().setZone("Asia/Jakarta");
    const todayEnd = now.endOf("day");
    const rangeStart = now.startOf("day").minus(ALLOWED_RANGES[range]);

    const startDateUTC = rangeStart.toUTC().toJSDate();
    const endDateUTC = todayEnd.toUTC().toJSDate();

    // ── AGGREGATE QUERY ──
    // SUM(amount) dan COUNT(*) di-group-by mutation_type dan transaction_type
    const aggregated = await Finance.findAll({
      where: {
        account_id: {
          [Op.in]: accountIds,
        },
        created_at: {
          [Op.between]: [startDateUTC, endDateUTC],
        },
      },
      attributes: [
        "mutation_type",
        "transaction_type",
        [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("amount")), 0), "total_amount"],
        [sequelize.fn("COUNT", sequelize.col("id")), "total_count"],
      ],
      group: ["mutation_type", "transaction_type"],
      raw: true,
    });

    // ── PARSE HASIL AGGREGATE ──
    let pemasukanAmount = 0;
    let pemasukanCount = 0;
    let pengeluaranAmount = 0;
    let pengeluaranCount = 0;

    aggregated.forEach((row) => {
      const amount = parseFloat(row.total_amount) || 0;
      const count = parseInt(row.total_count, 10) || 0;

      if (row.mutation_type === "masuk") {
        pemasukanAmount += amount;
        if (row.transaction_type === "income") {
          pemasukanCount += count;
        }
      } else if (row.mutation_type === "keluar") {
        pengeluaranAmount += amount;
        if (row.transaction_type === "expense") {
          pengeluaranCount += count;
        }
      }
    });

    // ── HITUNG NET MUTASI ──
    const netAmount = pemasukanAmount - pengeluaranAmount;

    let status;
    if (netAmount > 0) {
      status = "surplus";
    } else if (netAmount < 0) {
      status = "defisit";
    } else {
      status = "netral";
    }

    // ── RESPONSE ──
    return res.status(200).json({
      success: true,
      message: `Ringkasan mutasi ${RANGE_LABELS[range]} terakhir berhasil diambil`,
      data: {
        total_pemasukan: {
          amount: pemasukanAmount,
          count: pemasukanCount,
        },
        total_pengeluaran: {
          amount: pengeluaranAmount,
          count: pengeluaranCount,
        },
        net_mutasi: {
          amount: netAmount,
          status,
        },
      },
      meta: {
        period: {
          range,
          from: rangeStart.toUTC().toISO(),
          to: todayEnd.toUTC().toISO(),
        },
      },
    });
  } catch (error) {
    console.error("Get Mutasi Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil ringkasan mutasi",
    });
  }
};

module.exports = mutasiSummaryHandler;
