const { Op, fn, col, literal } = require("sequelize");

const {
  sequelize,
  Finance,
  Account,
  DailyFinanceSummary,
} = require("../../models");

const generateDailySummaryHandler = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    /**
     * ==========================================
     * 1. TENTUKAN TANGGAL HARI SEBELUMNYA
     * ==========================================
     */

    const now = new Date();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Awal hari
    const startDate = new Date(yesterday);
    startDate.setHours(0, 0, 0, 0);

    // Awal hari berikutnya
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    /**
     * ==========================================
     * 2. AMBIL DATA FINANCE
     *
     * Hanya:
     * - income
     * - expense
     *
     * Transfer tidak diambil.
     * ==========================================
     */

    const finances = await Finance.findAll({
      attributes: [
        "transaction_type",

        [
          fn("SUM", col("Finance.amount")),
          "total_amount",
        ],

        [
          fn("COUNT", col("Finance.id")),
          "total_transaction",
        ],
      ],

      include: [
        {
          model: Account,
          as: "account",
          attributes: ["user_id"],
          required: true,
        },
      ],

      where: {
        transaction_type: {
          [Op.in]: ["income", "expense"],
        },

        created_at: {
          [Op.gte]: startDate,
          [Op.lt]: endDate,
        },
      },

      group: [
        "account.user_id",
        "Finance.transaction_type",
      ],

      raw: true,

      transaction,
    });

    /**
     * ==========================================
     * 3. KELOMPOKKAN HASIL BERDASARKAN USER
     * ==========================================
     */

    const summaryByUser = {};

    for (const item of finances) {
      const userId = item["account.user_id"];

      if (!summaryByUser[userId]) {
        summaryByUser[userId] = {
          total_income: 0,
          total_expense: 0,
          total_transaction: 0,
        };
      }

      const totalAmount = Number(item.total_amount);
      const totalTransaction = Number(item.total_transaction);

      if (item.transaction_type === "income") {
        summaryByUser[userId].total_income = totalAmount;
      }

      if (item.transaction_type === "expense") {
        summaryByUser[userId].total_expense = totalAmount;
      }

      summaryByUser[userId].total_transaction += totalTransaction;
    }

    /**
     * ==========================================
     * 4. FORMAT TANGGAL UNTUK DATABASE
     * ==========================================
     */

    const date = startDate.toISOString().split("T")[0];

    /**
     * ==========================================
     * 5. UPSERT DAILY SUMMARY
     *
     * Jika sudah ada:
     * → update
     *
     * Jika belum ada:
     * → insert
     * ==========================================
     */

    const results = [];

    for (const userId in summaryByUser) {
      const summary = summaryByUser[userId];

      const [record, created] =
        await DailyFinanceSummary.upsert(
          {
            user_id: userId,
            date,

            total_income: summary.total_income,
            total_expense: summary.total_expense,
            total_transaction: summary.total_transaction,
          },
          {
            transaction,
          },
        );

      results.push({
        user_id: userId,
        total_income: summary.total_income,
        total_expense: summary.total_expense,
        total_transaction: summary.total_transaction,
        created,
      });
    }

    /**
     * ==========================================
     * 6. COMMIT TRANSACTION
     * ==========================================
     */

    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Daily finance summary berhasil dibuat",

      date,

      total_users: results.length,

      data: results,
    });
  } catch (error) {
    /**
     * ==========================================
     * ROLLBACK JIKA TERJADI ERROR
     * ==========================================
     */

    await transaction.rollback();

    console.error(
      "Generate Daily Summary Error:",
      error,
    );

    return res.status(500).json({
      status: false,
      message: "Gagal membuat daily finance summary",
    });
  }
};

module.exports = generateDailySummaryHandler;