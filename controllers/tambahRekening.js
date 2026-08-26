const supabase = require("../middleware/supabaseClient");

const addAccountHandler = async (req, res) => {
  const { name } = req.body; // Tidak perlu user_id dari body, karena diambil dari token
  const user_id = req.user?.id; // Ambil user_id dari token yang terautentikasi

  try {
    // Pastikan user_id dan name tidak kosong
    if (!user_id || !name) {
      return res
        .status(400)
        .json({ message: "User ID dan Nama rekening wajib diisi." });
    }

    // Insert data rekening ke tabel accounts dan select untuk mendapatkan datanya kembali
    const { data, error } = await supabase
      .from("accounts")
      .insert([{ user_id, name }])
      .select(); // Penting: gunakan select() untuk mendapatkan data yang baru dibuat

    if (error) {
      return res
        .status(500)
        .json({ message: "Gagal menambahkan rekening", error });
    }

    // Pastikan data ada dan tidak kosong
    if (!data || data.length === 0) {
      return res
        .status(500)
        .json({ message: "Data rekening tidak berhasil disimpan" });
    }

    // Ambil record pertama dari array hasil insert
    const insertedAccount = data[0];

    const responseData = {
      account_name: insertedAccount.name,
    };

    res.status(201).json({
      status: true,
      message: "Rekening berhasil ditambahkan",
      data: responseData,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = addAccountHandler;
