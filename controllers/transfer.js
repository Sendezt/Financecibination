// Import Supabase client dari middleware
const supabase = require("../middleware/supabaseClient");

const transferHandler = async (req, res) => {
  // Ambil user_id dari token yang sudah diverifikasi
  const user_id = req.user?.id;

  // Ambil data yang dikirim dari body request
  const { from_account_id, to_account_id, amount, deskripsi } = req.body;

  // Validasi Input, Semua field harus diisi kecuali deskripsi
  if (!from_account_id || !to_account_id || !amount || !user_id) {
    return res.status(400).json({
      message:
        "ID rekening asal, ID rekening tujuan, jumlah dan user ID wajib diisi.",
    });
  }

  if (from_account_id === to_account_id) {
    return res.status(400).json({
      message: "Rekening asal dan rekening tujuan tidak boleh sama.",
    });
  }

  const { error } = await supabase.rpc("transfer_saldo", {
    p_user_id: user_id,
    p_from_account: from_account_id,
    p_to_account: to_account_id,
    p_amount: amount,
    p_deskripsi: deskripsi || null,
  });

  if (error) {
    console.error("Error during transfer:", error);
    return res.status(400).json({
      message: "Gagal melakukan transfer",
      error,
    });
  }

  return res.status(200).json({
    status: true,
    message: "Transfer berhasil dilakukan",
  });
};

module.exports = transferHandler;