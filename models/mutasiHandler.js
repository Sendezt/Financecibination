const supabase = require("../middleware/supabaseClient");
const { DateTime, Zone } = require("luxon");

const mutasiMingguanHandler = async (req, res) => {
  const { wa_number } = req.query;

  try {
    if (!wa_number) {
      return res.status(400).json({ message: "WA number wajib diisi." });
    }

    // Ambil user_id berdasarkan wa_number
    const { data: user, error: userError } = await supabase
      .from("pengguna")
      .select("id")
      .eq("wa_number", wa_number)
      .single();

    if (userError || !user) {
      return res
        .status(404)
        .json({ message: "User tidak ditemukan berdasarkan WA number." });
    }

    const user_id = user.id;

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
