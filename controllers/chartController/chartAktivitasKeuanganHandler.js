const { DailyFinanceSummary, Finance, Account } = require("../../models");
const { DateTime } = require("luxon");
const { Op, fn, col } = require("sequelize");

const chartAktivitasKeuanganHandler = async (req, res) => {
  const user_id = req.user?.id;

  try {
    // ──────────────────────────────────────────
    // VALIDASI USER
    // ──────────────────────────────────────────
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
    }

    // ──────────────────────────────────────────
    // TENTUKAN PERIODE 7 HARI (hari ini + 6 hari ke belakang)
    // ──────────────────────────────────────────
    const now = DateTime.now().setZone("Asia/Jakarta");
    const today = now.startOf("day");
    const startDate = today.minus({ days: 6 });
    const yesterday = today.minus({ days: 1 });

    // Format DATEONLY untuk query DailyFinanceSummary
    const startDateStr = startDate.toFormat("yyyy-MM-dd");
    const yesterdayStr = yesterday.toFormat("yyyy-MM-dd");
    const todayStr = today.toFormat("yyyy-MM-dd");

    // Rentang waktu hari ini untuk tabel finance (00:00:00 s/d 23:59:59 Asia/Jakarta)
    const todayStart = today.toJSDate();
    const todayEnd = today.plus({ days: 1 }).toJSDate();

    // ──────────────────────────────────────────
    // QUERY DATA:
    // 1. Ambil data historis (H-6 s/d kemarin) dari daily_finance_summary
    // 2. Ambil data realtime hari ini langsung dari tabel finance
    // ──────────────────────────────────────────
    const [summaries, todayFinances] = await Promise.all([
      DailyFinanceSummary.findAll({
        where: {
          user_id,
          date: {
            [Op.between]: [startDateStr, yesterdayStr],
          },
        },
        attributes: ["date", "total_income", "total_expense"],
        order: [["date", "ASC"]],
        raw: true,
      }),
      Finance.findAll({
        attributes: [
          "transaction_type",
          [fn("SUM", col("Finance.amount")), "total_amount"],
        ],
        include: [
          {
            model: Account,
            as: "account",
            attributes: [],
            where: {
              user_id,
            },
            required: true,
          },
        ],
        where: {
          transaction_type: {
            [Op.in]: ["income", "expense"],
          },
          created_at: {
            [Op.gte]: todayStart,
            [Op.lt]: todayEnd,
          },
        },
        group: ["Finance.transaction_type"],
        raw: true,
      }),
    ]);

    // ──────────────────────────────────────────
    // BUAT MAP UNTUK LOOKUP CEPAT
    // ──────────────────────────────────────────
    const summaryMap = new Map();

    // 1. Masukkan data historis dari DailyFinanceSummary
    for (const row of summaries) {
      // row.date bisa berupa Date object atau string, normalize ke string
      const dateKey =
        row.date instanceof Date
          ? DateTime.fromJSDate(row.date).toFormat("yyyy-MM-dd")
          : String(row.date);
      summaryMap.set(dateKey, {
        income: parseFloat(row.total_income) || 0,
        expense: parseFloat(row.total_expense) || 0,
      });
    }

    // 2. Masukkan data realtime hari ini dari tabel Finance
    let todayIncome = 0;
    let todayExpense = 0;

    for (const item of todayFinances) {
      const amount = parseFloat(item.total_amount) || 0;
      if (item.transaction_type === "income") {
        todayIncome += amount;
      } else if (item.transaction_type === "expense") {
        todayExpense += amount;
      }
    }

    summaryMap.set(todayStr, {
      income: todayIncome,
      expense: todayExpense,
    });

    // ──────────────────────────────────────────
    // GENERATE 7 HARI LENGKAP (isi 0 jika tidak ada data)
    // ──────────────────────────────────────────
    const data = [];
    let totalIncome = 0;
    let totalExpense = 0;

    for (let i = 0; i < 7; i++) {
      const currentDate = startDate.plus({ days: i });
      const dateStr = currentDate.toFormat("yyyy-MM-dd");

      // Label singkat untuk axis chart: "9/6", "9/7", dst
      const label = `${currentDate.month}/${currentDate.day}`;

      const dayData = summaryMap.get(dateStr) || {
        income: 0,
        expense: 0,
      };

      totalIncome += dayData.income;
      totalExpense += dayData.expense;

      data.push({
        date: dateStr,
        label,
        income: dayData.income,
        expense: dayData.expense,
        net: dayData.income - dayData.expense,
      });
    }

    // ──────────────────────────────────────────
    // RESPONSE
    // ──────────────────────────────────────────
    return res.status(200).json({
      success: true,
      message: "Data aktivitas keuangan 7 hari terakhir berhasil diambil",
      data,
      meta: {
        period: {
          from: startDateStr,
          to: todayStr,
        },
        summary: {
          total_income: totalIncome,
          total_expense: totalExpense,
          net: totalIncome - totalExpense,
        },
      },
    });
  } catch (error) {
    console.error("Chart Aktivitas Keuangan Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Terjadi kesalahan saat mengambil data aktivitas keuangan",
    });
  }
};

module.exports = chartAktivitasKeuanganHandler;
