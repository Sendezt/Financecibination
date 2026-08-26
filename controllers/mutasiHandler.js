const supabase = require("../middleware/supabaseClient");
const { DateTime } = require("luxon");

const mutasiMingguanHandler = async (req, res) => {
  const user_id = req.user?.id; // Ambil user_id dari token yang sudah diverifikasi

  try {
    // Pastikan user_id ada (jika token tidak valid atau tidak ada)
    if (!user_id) {
      return res.status(401).json({ message: "User tidak terautentikasi." });
    }

    // Ambil semua account milik user
    const { data: accounts, error: accError } = await supabase
      .from("accounts")
      .select("id, name")
      .eq("user_id", user_id);

    if (accError || !accounts || accounts.length === 0) {
      return res.status(404).json({ message: "Tidak ada account ditemukan." });
    }

    const accountIdToName = {};
    const accountIds = accounts.map((a) => {
      accountIdToName[a.id] = a.name;
      return a.id;
    });

    // Ambil tanggal 7 hari terakhir
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDate = sevenDaysAgo.toISOString().split("T")[0];

    // Ambil mutasi
    const { data: finance, error: finError } = await supabase
      .from("finance")
      .select("*")
      .in("account_id", accountIds)
      .gte("created_at", fromDate)
      .order("created_at", { ascending: false });

    if (finError) {
      return res
        .status(500)
        .json({ message: "Gagal mengambil data mutasi", error: finError });
    }

    // Tambahkan nama account ke setiap transaksi
    const dataWithAccountNames = finance.map((item) => ({
      ...item,
      account_name: accountIdToName[item.account_id] || "Tidak diketahui",
      date_indonesia: DateTime.fromISO(item.created_at, { zone: "utc" })
        .setZone("Asia/Jakarta")
        .toFormat("yyyy-MM-dd HH:mm:ss"),
    }));

    res.status(200).json({
      status: true,
      message: "Data mutasi 1 minggu terakhir",
      data: dataWithAccountNames,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = mutasiMingguanHandler;
