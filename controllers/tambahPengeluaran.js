const supabase = require("../middleware/supabaseClient");

const tambahPengeluaranHandler = async (req, res) => {
  const { name, amount, note, created_at } = req.body;
  const user_id = req.user?.id; // Ambil user_id dari token yang sudah diverifikasi

  try {
    // Validasi input
    if (!name || !amount || !user_id) {
      return res.status(400).json({
        message: "Nama rekening, jumlah, dan User ID wajib diisi.",
      });
    }

    // Cek apakah rekening dengan nama tersebut dimiliki oleh user ini
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("id, user_id")
      .eq("name", name)
      .eq("user_id", user_id)
      .single(); // Mengambil satu akun berdasarkan nama dan user_id

    if (accountError || !account) {
      return res.status(404).json({
        message:
          "Rekening dengan nama tersebut tidak ditemukan atau tidak dimiliki oleh user.",
      });
    }

    // Insert pengeluaran ke tabel finance
    const { data, error } = await supabase
      .from("finance")
      .insert([
        {
          account_id: account.id,
          amount: Number(amount),
          mutation_type: "keluar", // pengeluaran
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
