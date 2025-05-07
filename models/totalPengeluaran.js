const supabase = require("../middleware/supabaseClient");

const getPengeluaranByUserHandler = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: "User ID wajib diisi." });
  }

  try {
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
        .select("amount")
        .eq("account_id", account.id)
        .eq("mutation_type", "keluar");

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
      data: result,
      total_pengeluaran_user,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = getPengeluaranByUserHandler;
