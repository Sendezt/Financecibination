const supabase = require("../middleware/supabaseClient");

const tambahPemasukanHandler = async (req, res) => {
  const { account_id, amount, note, created_at, user_id } = req.body;

  try {
    // Validasi input
    if (!account_id || !amount || !user_id) {
      return res.status(400).json({
        message: "Account ID, jumlah dan user ID wajib diisi.",
      });
    }

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
          amount: Number(amount),
          mutation_type: "masuk",
          note,
          created_at: created_at || new Date().toISOString(),
        },
      ])
      .select()
      .single();

    console.log("Data yang dimasukkan:", data);

    if (error || !data) {
      console.error("Error inserting data:", error);
      return res.status(500).json({
        message: "Gagal menambahkan pemasukan",
        error,
      });
    }

    res.status(201).json({
      status: true,
      message: "Pemasukan berhasil ditambahkan",
      data: {
        amount: data.amount,
        note: data.note,
        created_at: data.created_at,
      },
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = tambahPemasukanHandler;
