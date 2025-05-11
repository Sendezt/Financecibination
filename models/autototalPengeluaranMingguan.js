const supabase = require("../middleware/supabaseClient");

function getWeekRangeFromDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based
  const day = date.getDate();

  const firstDayOfMonth = new Date(year, month, 1);
  const dayOfWeek = firstDayOfMonth.getDay(); // 0: Sunday, 1: Monday, ...
  const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const daysSinceFirst = day - 1;
  const week = Math.floor((daysSinceFirst + adjustedDayOfWeek) / 7) + 1;

  const offset = (week - 1) * 7 - adjustedDayOfWeek;
  const start = new Date(firstDayOfMonth);
  start.setDate(firstDayOfMonth.getDate() + offset);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return { start, end, week, month: month + 1, year };
}

const getTotalPengeluaranMingguanByUserHandler = async (req, res) => {
  // Ambil user_id dari token autentikasi
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(400).json({ message: "User tidak terautentikasi." });
  }

  const today = new Date();
  const { start, end, week, month, year } = getWeekRangeFromDate(today);

  try {
    // Ambil akun pengguna
    const { data: accounts, error: accountError } = await supabase
      .from("accounts")
      .select("id, name")
      .eq("user_id", user_id);

    if (accountError) {
      return res.status(500).json({
        message: "Gagal mengambil akun pengguna",
        error: accountError,
      });
    }

    let total_pengeluaran_user = 0;
    const result = [];

    // Hitung pengeluaran untuk setiap akun
    for (const account of accounts) {
      const { data: pengeluaran, error } = await supabase
        .from("finance")
        .select("amount, created_at")
        .eq("account_id", account.id)
        .eq("mutation_type", "keluar")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());

      if (error) {
        return res
          .status(500)
          .json({ message: "Gagal mengambil data finance", error });
      }

      const total_pengeluaran = pengeluaran.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0
      );

      total_pengeluaran_user += total_pengeluaran;

      result.push({
        account_id: account.id,
        nama_rekening: account.name,
        total_pengeluaran: total_pengeluaran,
      });
    }

    // Kembalikan hasil
    res.status(200).json({
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
      total_pengeluaran_user,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = getTotalPengeluaranMingguanByUserHandler;
