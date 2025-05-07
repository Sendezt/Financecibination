const supabase = require("../middleware/supabaseClient");

const getPemasukanByUserHandler = async (req, res) => {
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

    let total_pemasukan_user = 0;
    const result = [];

    // Loop setiap account untuk hitung pemasukan
    for (const account of accounts) {
      const { data: pemasukan, error } = await supabase
        .from("finance")
        .select("amount")
        .eq("account_id", account.id)
        .eq("mutation_type", "masuk");

      if (error) {
        return res
          .status(500)
          .json({ message: "Gagal mengambil data finance", error });
      }

      const total_pemasukan = pemasukan.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0
      );

      total_pemasukan_user += total_pemasukan;

      result.push({
        account_id: account.id,
        nama_rekening: account.name,
        total_pemasukan,
      });
    }

    res.status(200).json({
      status: true,
      user_id,
      data: result,
      total_pemasukan_user,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = getPemasukanByUserHandler;
