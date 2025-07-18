const supabase = require("../middleware/supabaseClient");

const riwayatTransferHandler = async (req, res) => {
  const user_id = req.user?.id; // Ambil user_id dari token yang sudah diverifikasi

  // Ambil data riwayat 4 minggu(28 hari) terakhir
  const now = new Date();
  const fourWeeksAgoDate = new Date(now);
  fourWeeksAgoDate.setDate(now.getDate() - 28);
  const fourWeeksAgo = fourWeeksAgoDate.toISOString();

  const { data, error } = await supabase
    .from("transfers")
    .select(
      "*, from_account:from_account_id(name), to_account:to_account_id(name)"
    )
    .eq("user_id", user_id)
    .gte("created_at", fourWeeksAgo)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching transfer history:", error);
    return res.status(500).json({
      message: "Gagal mengambil riwayat transfer",
      error,
    });
  }

  return res.status(200).json({ status: true, data });
};

module.exports = riwayatTransferHandler;
