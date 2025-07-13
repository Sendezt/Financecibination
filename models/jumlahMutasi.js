const supabase = require("../middleware/supabaseClient");
const { DateTime } = require("luxon");

const getJumlahMutasiHandler = async (req, res) => {
  const user_id = req.user?.id; // Ambil user_id dari token yang terautentikasi

  if (!user_id) {
    return res.status(400).json({ message: "User ID wajib diisi." });
  }

  try {
    // Ambil tanggal hari ini dan 6 hari sebelumnya
    const today = DateTime.now().setZone("Asia/Jakarta");
    const startDate = today.minus({ days: 6 }).startOf("day");
    const endDate = today.endOf("day");

    // Ambil semua akun milik user_id
    const { data: accounts, error: accountError } = await supabase
      .from("accounts")
      .select("id, name")
      .eq("user_id", user_id);

    if (accountError) {
      return res.status(500).json({
        message: "Gagal mengambil akun pengguna",
        error: accountError,
      });
    }

    let total_pemasukan = 0;
    let total_pengeluaran = 0;
    const harianresult = {}; // objek untuk menyimpan hasil harian

    // Loop melalui setiap akun untuk mendapatkan mutasi
    for (const account of accounts) {
      const { data: mutasi, error } = await supabase
        .from("finance")
        .select("amount, created_at, mutation_type")
        .eq("account_id", account.id)
        .gte("created_at", startDate.toISO())
        .lt("created_at", endDate.toISO());

      if (error) {
        return res.status(500).json({
          message: "Gagal mengambil mutasi akun",
          error,
        });
      }

      mutasi.forEach((item) => {
        const date = DateTime.fromISO(item.created_at, { zone: "utc" })
          .setZone("Asia/Jakarta")
          .toFormat("yyyy-MM-dd");

        const amonunt = parseFloat(item.amount);

        // Inisialisasi objek untuk tanggal jika belum ada
        if (!harianresult[date]) {
          harianresult[date] = {
            tanggal: date,
            total_pemasukan: 0,
            total_pengeluaran: 0,
          };
        }

        if (item.mutation_type === "masuk") {
          harianresult[date].total_pemasukan += amonunt;
          total_pemasukan += amonunt;
        } else if (item.mutation_type === "keluar") {
          harianresult[date].total_pengeluaran += amonunt;
          total_pengeluaran += amonunt;
        }
      });
    }

    // looping data seminggu terakhir
    for (let i = 0; i < 7; i++) {
      const date = startDate.plus({ days: i }).toFormat("yyyy-MM-dd");
      if (!harianresult[date]) {
        harianresult[date] = {
          tanggal: date,
          total_pemasukan: 0,
          total_pengeluaran: 0,
        };
      }
    }

    // Mengubah objek harianresult menjadi array
    const resultArray = Object.values(harianresult).sort((a, b) =>
      a.tanggal.localeCompare(b.tanggal)
    );

    res.status(200).json({
      status: true,
      user_id,
      periode: {
        mulai: startDate.toISODate(),
        selesai: endDate.toISODate(),
      },
      data: resultArray,
      total_pemasukan,
      total_pengeluaran,
    });
  } catch (error) {
    console.error("Error fetching jumlah mutasi:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data jumlah mutasi",
      error: error.message,
    });
  }
};

module.exports = getJumlahMutasiHandler;


