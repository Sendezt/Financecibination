const supabase = require("../middleware/supabaseClient");

const tambahPemasukanHandler = async (req, res) => {
  const { account_id, amount, note, date, wa_number } = req.body;

  try {
    // Validasi input
    if (!account_id || !amount || !wa_number) {
      return res
        .status(400)
        .json({ message: "Account ID, jumlah dan WA number wajib diisi." });
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

    // Insert pemasukan ke tabel finance
    const { data, error } = await supabase
      .from("finance")
      .insert([
        {
          account_id: account.id,
          amount,
          mutation_type: "masuk",
          note,
          date: date || new Date().toISOString().split("T")[0],
        },
      ])
      .single();

    if (error) {
      return res
        .status(500)
        .json({ message: "Gagal menambahkan pemasukan", error });
    }

    res.status(201).json({
      status: true,
      message: "Pemasukan berhasil ditambahkan",
      data,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = tambahPemasukanHandler;
