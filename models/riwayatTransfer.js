const supabase = require("../middleware/supabaseClient");

const riwayatTransferHandler = async (req, res) => {
  const user_id = req.user?.id; // Ambil user_id dari token yang sudah diverifikasi

  const { data, error } = await supabase
    .from("transfers")
    .select(
      "*, from_account:from_account_id(name), to_account:to_account_id(name)"
    )
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching transfer history:", error);
    return res.status(500).json({
      message: "Gagal mengambil riwayat transfer",
      error,
    });
  }

  return res.status(200).json({ data });
};

module.exports = riwayatTransferHandler;
