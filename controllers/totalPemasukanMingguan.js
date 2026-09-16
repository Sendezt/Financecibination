const { Account, Finance } = require("../models");
const { Op, fn, col, literal } = require("sequelize");

/**
 * Menghitung rentang tanggal (start – end) untuk minggu tertentu
 * di dalam bulan & tahun yang diberikan.
 *
 * Minggu dimulai dari Senin (ISO week).
 */
function getWeekRange(year, month, week) {
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const dayOfWeek = firstDayOfMonth.getDay(); // 0:Sunday, 1:Monday, ...
  const offset = (week - 1) * 7 - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);

  const start = new Date(firstDayOfMonth);
  start.setDate(firstDayOfMonth.getDate() + offset);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return { start, end };
}

const getTotalPemasukanMingguanByUserHandler = async (req, res) => {
  const { month, year, week } = req.query;
  const user_id = req.user?.id; // Ambil user_id dari token yang terautentikasi

  if (!user_id || !month || !year || !week) {
    return res.status(400).json({ message: "Semua parameter wajib diisi." });
  }

  const { start, end } = getWeekRange(
    parseInt(year),
    parseInt(month),
    parseInt(week)
  );

  try {
    // Ambil akun milik user
    const accounts = await Account.findAll({
      where: { user_id },
      attributes: ["id", "name"],
      raw: true,
    });

    if (accounts.length === 0) {
      return res.status(200).json({
        status: true,
        user_id,
        bulan: month,
        tahun: year,
        minggu: week,
        rentang_tanggal: {
          start: start.toISOString().split("T")[0],
          end: end.toISOString().split("T")[0],
        },
        data: [],
        total_pemasukan_user: 0,
      });
    }

    const accountIds = accounts.map((acc) => acc.id);

    // Ambil total pemasukan per akun dalam 1 query (menghindari N+1)
    const pemasukanPerAccount = await Finance.findAll({
      where: {
        account_id: { [Op.in]: accountIds },
        mutation_type: "masuk",
        created_at: {
          [Op.gte]: start,
          [Op.lt]: end,
        },
      },
      attributes: [
        "account_id",
        [fn("COALESCE", fn("SUM", col("amount")), 0), "total_pemasukan"],
      ],
      group: ["account_id"],
      raw: true,
    });

    // Buat map account_id -> total_pemasukan untuk lookup cepat
    const pemasukanMap = {};
    for (const row of pemasukanPerAccount) {
      pemasukanMap[row.account_id] = parseFloat(row.total_pemasukan);
    }

    // Susun hasil per akun
    let total_pemasukan_user = 0;
    const result = accounts.map((account) => {
      const total_pemasukan = pemasukanMap[account.id] || 0;
      total_pemasukan_user += total_pemasukan;

      return {
        account_id: account.id,
        nama_rekening: account.name,
        total_pemasukan,
      };
    });

    return res.status(200).json({
      status: true,
      user_id,
      bulan: month,
      tahun: year,
      minggu: week,
      rentang_tanggal: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      },
      data: result,
      total_pemasukan_user,
    });
  } catch (err) {
    console.error("Get Total Pemasukan Mingguan Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = getTotalPemasukanMingguanByUserHandler;

