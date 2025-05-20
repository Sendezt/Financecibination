const supabase = require("../middleware/supabaseClient");
const { DateTime } = require("luxon");

const getPengeluaranHarianByUserHandler = async (req, res) => {
  const user_id = req.user?.id; // Ambil user_id dari token yang terautentikasi

  if (!user_id) {
    return res.status(400).json({ message: "User ID wajib diisi." });
  }

  try {
    const today = new Date();
    const month = today.getMonth() + 1; // Bulan saat ini (1-12)
    const year = today.getFullYear(); // Tahun saat ini

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
    const harianResult = {}; // objek untuk menyimpan hasil per hari

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

      // Loop setiap pengeluaran untuk hitung total per hari
      pengeluaran.forEach((item) => {
        const date = DateTime.fromISO(item.created_at, { zone: "utc" })
          .setZone("Asia/Jakarta")
          .toFormat("yyyy-MM-dd"); // Ambil tanggal dari created_at dengan format YYYY-MM-DD
        const amount = parseFloat(item.amount);

        if (!harianResult[date]) {
          harianResult[date] = {
            tanggal: date,
            total_pengeluaran: 0,
          };
        }

        harianResult[date].total_pengeluaran += amount;
        total_pengeluaran_user += amount;
      });
    }

    // Ubah objek harianResult menjadi array dan urutkan berdasarkan tanggal
    const resultArray = Object.values(harianResult).sort((a, b) =>
      a.tanggal.localeCompare(b.tanggal)
    );

    res.status(200).json({
      status: true,
      user_id,
      bulan: month,
      tahun: year,
      data: resultArray,
      total_pengeluaran_user,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = getPengeluaranHarianByUserHandler;
