const supabase = require("../middleware/supabaseClient");

const tambahPengeluaranHandler = async (req, res) => {
  const { account_id, amount, note, created_at, wa_number } = req.body;

  try {
    // Validasi input
    if (!account_id || !amount || !wa_number) {
      return res.status(400).json({
        message: "Account ID, jumlah, dan WA number wajib diisi.",
      });
    }

    // Ambil user_id berdasarkan wa_number
    const { data: userIdResult, error: userIdError } = await supabase.rpc(
      "get_user_id_by_wa",
      { input_wa: wa_number }
    );

    if (userIdError || !userIdResult) {
      return res
        .status(404)
        .json({ message: "User tidak ditemukan berdasarkan WA number." });
    }

    const user_id = userIdResult;

    // Cek apakah rekening dimiliki oleh user ini
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("id, user_id")
      .eq("id", account_id)
      .eq("user_id", user_id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({
        message: "Rekening tidak ditemukan atau tidak dimiliki oleh user.",
      });
    }

    // Insert pengeluaran ke tabel finance
    const { data, error } = await supabase
      .from("finance")
      .insert([
        {
          account_id: account.id,
          amount: Number(amount),
          mutation_type: "keluar", // <--- bedanya di sini
          note,
          created_at: created_at || new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return res
        .status(500)
        .json({ message: "Gagal menambahkan pengeluaran", error });
    }

    res.status(201).json({
      status: true,
      message: "Pengeluaran berhasil ditambahkan",
      data: {
        amount: data.amount,
        note: data.note,
      },
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = tambahPengeluaranHandler;
