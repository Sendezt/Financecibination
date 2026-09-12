const { Account, Finance } = require("../models");
const { DateTime } = require("luxon");
const { Op } = require("sequelize");

/**
 * KONFIGURASI RENTANG WAKTU YANG DIIZINKAN
 * Key = nilai query param `range`
 * Value = konfigurasi Luxon .minus()
 *
 * Default: 7d (7 hari)
 */
const ALLOWED_RANGES = {
  "7d": { days: 6 },   // Hari ini + 6 hari ke belakang = 7 hari kalender
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
};

/**
 * DEFAULT & BATAS PAGINATION
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 100;

const mutasiHandler = async (req, res) => {
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

    /**
     * PARSING QUERY PARAMS
     */
    const range = ALLOWED_RANGES[req.query.range]
      ? req.query.range
      : "7d";

    const page = Math.max(
      parseInt(req.query.page, 10) || DEFAULT_PAGE,
      1,
    );

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );

    const offset = (page - 1) * limit;

    // AMBIL REKENING MILIK USER
    // Memanfaatkan index: idx_accounts_user_id (user_id)
    const accounts = await Account.findAll({
      where: {
        user_id,
      },
      attributes: ["id"],
      raw: true,
    });

    // JIKA USER BELUM MEMILIKI REKENING
    if (accounts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Data mutasi berhasil diambil",
        data: [],
        meta: {
          period: {
            range,
            from: null,
            to: null,
          },
          pagination: {
            page,
            limit,
            total_items: 0,
            total_pages: 0,
          },
        },
      });
    }

    // AMBIL ID SEMUA REKENING
    const accountIds = accounts.map((account) => account.id);

    /**
     * TENTUKAN PERIODE BERDASARKAN RANGE
     * Menggunakan timezone Asia/Jakarta
     */
    const now = DateTime.now().setZone("Asia/Jakarta");
    const todayEnd = now.endOf("day");
    const rangeStart = now.startOf("day").minus(ALLOWED_RANGES[range]);

    // Konversi ke UTC untuk query database
    const startDateUTC = rangeStart.toUTC().toJSDate();
    const endDateUTC = todayEnd.toUTC().toJSDate();

    /**
     * AMBIL DATA MUTASI DENGAN PAGINATION
     *
     * Memanfaatkan composite index:
     *   idx_finance_account_created_at (account_id, created_at)
     *
     * Index ini optimal karena query melakukan:
     *   1. Filter account_id IN (...) — kolom pertama index
     *   2. Filter created_at BETWEEN — kolom kedua index
     *   3. ORDER BY created_at DESC — kolom kedua index (backward scan)
     */
    const { rows: finance, count: totalItems } =
      await Finance.findAndCountAll({
        where: {
          account_id: {
            [Op.in]: accountIds,
          },

          created_at: {
            [Op.between]: [
              startDateUTC,
              endDateUTC,
            ],
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

        limit,
        offset,
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

    const totalPages = Math.ceil(totalItems / limit);

    // RESPONSE
    return res.status(200).json({
      success: true,

      message: `Data mutasi ${RANGE_LABELS[range]} terakhir berhasil diambil`,

      data,

      meta: {
        period: {
          range,
          from: rangeStart.toISO(),
          to: todayEnd.toISO(),
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
    // Log lengkap hanya di backend
    console.error(
      "Get Mutasi Error:",
      error,
    );

    // Jangan kirim error.message ke production
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data mutasi",
    });
  }
};

module.exports = mutasiHandler;