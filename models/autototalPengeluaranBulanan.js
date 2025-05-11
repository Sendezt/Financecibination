const supabase = require("../middleware/supabaseClient");

const getPengeluaranByUserHandler = async (req, res) => {
  const user_id = req.user?.id; // Ambil user_id dari token yang terautentikasi

  if (!user_id) {
    return res.status(400).json({ message: "User ID wajib diisi." });
  }

  try {
    const today = new Date();
    const month = today.getMonth() + 1; // Bulan saat ini (1-12)
    const year = today.getFullYear(); // Tahun saat ini

    // Tentukan rentang waktu bulan berjalan (dari 1 hingga akhir bulan)
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // Awal bulan berikutnya

    // Ambil semua account milik user_id
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

    // Loop setiap account untuk hitung pengeluaran
    for (const account of accounts) {
      const { data: pengeluaran, error } = await supabase
        .from("finance")
        .select("amount, created_at")
        .eq("account_id", account.id)
        .eq("mutation_type", "keluar")
        .gte("created_at", startDate.toISOString())
        .lt("created_at", endDate.toISOString());

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
        total_pengeluaran,
      });
    }

    res.status(200).json({
      status: true,
      user_id,
      bulan: month,
      tahun: year,
      data: result,
      total_pengeluaran_user,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = getPengeluaranByUserHandler;
