const supabase = require("../middleware/supabaseClient");

function getWeekRange(year, month, week) {
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const dayOfWeek = firstDayOfMonth.getDay(); // 0: Sunday, 1: Monday, ...
  const offset = (week - 1) * 7 - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);

  const start = new Date(firstDayOfMonth);
  start.setDate(firstDayOfMonth.getDate() + offset);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return { start, end };
}

const getPengeluaranMingguanByUserHandler = async (req, res) => {
  const { user_id, month, year, week } = req.query;

  if (!user_id || !month || !year || !week) {
    return res.status(400).json({
      message: "Parameter user_id, month, year, dan week wajib diisi.",
    });
  }

  const { start, end } = getWeekRange(parseInt(year), parseInt(month), parseInt(week));

  try {
    // Ambil akun user
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

    for (const account of accounts) {
      const { data: pengeluaran, error } = await supabase
        .from("finance")
        .select("amount, created_at")
        .eq("account_id", account.id)
        .eq("mutation_type", "keluar")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());

      if (error) {
        return res.status(500).json({
          message: "Gagal mengambil data finance",
          error,
        });
      }

      const total_pengeluaran = pengeluaran.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0
      );

      total_pengeluaran_user += total_pengeluaran;

      result.push({
        account_id: account.id,
        nama_rekening: account.name,
        total_pengeluaran,
      });
    }

    res.status(200).json({
      status: true,
      user_id,
      bulan: month,
      tahun: year,
      minggu: week,
      rentang_tanggal: {
        dari: start.toISOString().split("T")[0],
        sampai: end.toISOString().split("T")[0],
      },
      data: result,
      total_pengeluaran_user,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = getPengeluaranMingguanByUserHandler;
