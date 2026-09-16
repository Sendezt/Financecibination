const { Account, Finance } = require("../models");
const { DateTime } = require("luxon");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

/**
 * KONFIGURASI RENTANG WAKTU YANG DIIZINKAN
 */
const ALLOWED_RANGES = {
  "7d": { days: 6 }, // Hari ini + 6 hari ke belakang = 7 hari kalender
  "1m": { months: 1 },
  "3m": { months: 3 },
};

/**
 * LABEL DESKRIPTIF UNTUK RESPONSE MESSAGE
 */
const RANGE_LABELS = {
  "7d": "7 hari",
  "1m": "1 bulan",
  "3m": "3 bulan",
  "all": "keseluruhan",
};

/**
 * DEFAULT & BATAS PAGINATION
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 100;

/**
 * Format tanggal ke format ISO UTC (Z) sesuai dengan waktu database
 * tanpa pergeseran offset zona waktu (-7 jam).
 */
const formatToIsoUtc = (date) => {
  if (!date) return null;

  if (typeof date === "string") {
    const clean = date.replace(" ", "T").replace(/Z|[+-]\d{2}(:\d{2})?$/, "");
    return clean.includes(".") ? `${clean}Z` : `${clean}.000Z`;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
};

/**
 * Controller untuk mengambil detail mutasi per rekening (account) tertentu
 * GET /api/mutasi/account/:accountId
 */
const mutasiByAccountHandler = async (req, res) => {
  const user_id = req.user?.id;
  const accountId = req.params.accountId || req.params.id;

  try {
    // 1. VALIDASI USER
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
    }

    // 2. VALIDASI PARAMETER REKENING
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "ID rekening wajib disertakan",
      });
    }

    // 3. CARI REKENING & PASTIKAN MILIK USER TERSEBUT
    const account = await Account.findOne({
      where: {
        id: accountId,
        user_id,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Rekening tidak ditemukan atau bukan milik Anda",
      });
    }

    // 4. PARSING QUERY PARAMS
    const rawRange = req.query.range;
    const range = rawRange === "all" ? "all" : (ALLOWED_RANGES[rawRange] ? rawRange : "7d");

    const page = Math.max(parseInt(req.query.page, 10) || DEFAULT_PAGE, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );
    const offset = (page - 1) * limit;

    const mutationType = req.query.mutation_type;
    const transactionType = req.query.transaction_type;

    // 5. TENTUKAN PERIODE WAKTU JIKA BUKAN 'all'
    const whereClause = {
      account_id: account.id,
    };

    let startDateUTC = null;
    let endDateUTC = null;
    let rangeStartIso = null;
    let todayEndIso = null;

    if (range !== "all") {
      const now = DateTime.now().setZone("Asia/Jakarta");
      const todayEnd = now.endOf("day");
      const rangeStart = now.startOf("day").minus(ALLOWED_RANGES[range]);

      startDateUTC = rangeStart.toUTC().toJSDate();
      endDateUTC = todayEnd.toUTC().toJSDate();
      rangeStartIso = rangeStart.toUTC().toISO();
      todayEndIso = todayEnd.toUTC().toISO();

      whereClause.created_at = {
        [Op.between]: [startDateUTC, endDateUTC],
      };
    }

    // Filter opsional mutation_type & transaction_type
    if (mutationType && ["masuk", "keluar"].includes(mutationType)) {
      whereClause.mutation_type = mutationType;
    }

    if (transactionType && ["income", "expense", "transfer"].includes(transactionType)) {
      whereClause.transaction_type = transactionType;
    }

    // 6. QUERY MUTASI DENGAN PAGINATION
    const { rows: finance, count: totalItems } = await Finance.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Account,
          as: "account",
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    // 7. QUERY AGGREGATE SUMMARY UNTUK REKENING INI
    const summaryWhereClause = {
      account_id: account.id,
    };
    if (range !== "all") {
      summaryWhereClause.created_at = {
        [Op.between]: [startDateUTC, endDateUTC],
      };
    }

    const aggregated = await Finance.findAll({
      where: summaryWhereClause,
      attributes: [
        "mutation_type",
        "transaction_type",
        [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("amount")), 0), "total_amount"],
        [sequelize.fn("COUNT", sequelize.col("id")), "total_count"],
      ],
      group: ["mutation_type", "transaction_type"],
      raw: true,
    });

    let pemasukanAmount = 0;
    let pemasukanCount = 0;
    let pengeluaranAmount = 0;
    let pengeluaranCount = 0;

    aggregated.forEach((row) => {
      const amount = parseFloat(row.total_amount) || 0;
      const count = parseInt(row.total_count, 10) || 0;

      if (row.mutation_type === "masuk") {
        pemasukanAmount += amount;
        pemasukanCount += count;
      } else if (row.mutation_type === "keluar") {
        pengeluaranAmount += amount;
        pengeluaranCount += count;
      }
    });

    const netAmount = pemasukanAmount - pengeluaranAmount;
    let netStatus = "netral";
    if (netAmount > 0) {
      netStatus = "surplus";
    } else if (netAmount < 0) {
      netStatus = "defisit";
    }

    // 8. FORMAT DATA TRANSAKSI
    const data = finance.map((item) => ({
      id: item.id,
      account: {
        id: item.account_id,
        name: item.account?.name || account.name || "Tidak diketahui",
      },
      amount: Number(item.amount),
      mutation_type: item.mutation_type,
      transaction_type: item.transaction_type,
      transfer_id: item.transfer_id,
      note: item.note,
      created_at: formatToIsoUtc(item.created_at),
    }));

    const totalPages = Math.ceil(totalItems / limit);

    // 9. RESPONSE
    return res.status(200).json({
      success: true,
      message: `Data mutasi rekening ${account.name} (${RANGE_LABELS[range]} terakhir) berhasil diambil`,
      account: {
        id: account.id,
        name: account.name,
        saldo: Number(account.saldo),
        last_updated: account.last_updated,
        created_at: account.created_at,
      },
      summary: {
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
          status: netStatus,
        },
      },
      data,
      meta: {
        period: {
          range,
          from: rangeStartIso,
          to: todayEndIso,
        },
        pagination: {
          page,
          limit,
          total_items: totalItems,
          total_pages: totalPages,
          has_previous: page > 1,
          has_next: page < totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Get Mutasi by Account Error:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data mutasi rekening",
    });
  }
};

module.exports = mutasiByAccountHandler;
