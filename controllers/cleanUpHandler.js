const supabase = require("../middleware/supabaseClient");

const hapusFinanceLamaHandler = async (req, res) => {
  try {
    // Hitung tanggal 1 tahun yang lalu dari hari ini
    const today = new Date();
    const oneYearAgo = new Date(today.setFullYear(today.getFullYear() - 1));
    const oneYearAgoStr = oneYearAgo.toISOString().split("T")[0];

    // Hapus data yang lebih lama dari 1 tahun
    const { data, error } = await supabase
      .from("finance")
      .delete()
      .lt("created_at", oneYearAgoStr)
      .select();

    if (error) {
      return res
        .status(500)
        .json({ message: "Gagal menghapus data lama", error });
    }

    res.status(200).json({
      status: true,
      message: "Data yang lebih dari 1 tahun berhasil dihapus",
      deleted_rows: data.length,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = hapusFinanceLamaHandler;
