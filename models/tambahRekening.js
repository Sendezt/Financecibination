const supabase = require("../middleware/supabaseClient");

const addAccountHandler = async (req, res) => {
  const { user_id, name } = req.body;

  try {
    // Pastikan user_id, name tidak kosong
    if (!user_id || !name) {
      return res.status(400).json({ message: "User ID dan Nama rekening wajib diisi." });
    }

    // Insert data rekening ke tabel accounts
    const { data, error } = await supabase
      .from("accounts")
      .insert([{ user_id, name }])
      .single();

    if (error) {
      return res.status(500).json({ message: "Gagal menambahkan rekening", error });
    }

    res.status(201).json({
      status: true,
      message: "Rekening berhasil ditambahkan",
      data,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = addAccountHandler;
