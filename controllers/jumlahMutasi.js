const { Account, Finance } = require("../models");
const { Op } = require("sequelize");
const { DateTime } = require("luxon");

const getJumlahMutasiHandler = async (req, res) => {
  const user_id = req.user?.id; // Ambil user_id dari token yang terautentikasi

  if (!user_id) {
    return res.status(401).json({
      status: false,
      message: "User ID wajib diisi.",
    });
  }

  try {
    // Ambil tanggal hari ini dan 6 hari sebelumnya (zona Asia/Jakarta)
    const today = DateTime.now().setZone("Asia/Jakarta");
    const startDate = today.minus({ days: 6 }).startOf("day");
    const endDate = today.endOf("day");

    // Ambil semua akun milik user_id
    const accounts = await Account.findAll({
      where: { user_id },
      attributes: ["id", "name"],
      raw: true,
    });

    let total_pemasukan = 0;
    let total_pengeluaran = 0;
    const harianresult = {}; // Objek untuk menyimpan hasil harian

    // Inisialisasi awal 7 hari terakhir dengan nilai 0
    for (let i = 0; i < 7; i++) {
      const date = startDate.plus({ days: i }).toFormat("yyyy-MM-dd");
      harianresult[date] = {
        tanggal: date,
        total_pemasukan: 0,
        total_pengeluaran: 0,
      };
    }

    if (accounts.length > 0) {
      const accountIds = accounts.map((account) => account.id);

      // Ambil seluruh mutasi dalam rentang waktu sekaligus (tanpa looping query)
      const mutasi = await Finance.findAll({
        where: {
          account_id: {
            [Op.in]: accountIds,
          },
          created_at: {
            [Op.gte]: startDate.toJSDate(),
            [Op.lte]: endDate.toJSDate(),
          },
        },
        attributes: ["amount", "created_at", "mutation_type"],
        raw: true,
      });

      mutasi.forEach((item) => {
        const date = (
          item.created_at instanceof Date
            ? DateTime.fromJSDate(item.created_at)
            : DateTime.fromISO(item.created_at, { zone: "utc" })
        )
          .setZone("Asia/Jakarta")
          .toFormat("yyyy-MM-dd");

        const amount = parseFloat(item.amount) || 0;

        if (!harianresult[date]) {
          harianresult[date] = {
            tanggal: date,
            total_pemasukan: 0,
            total_pengeluaran: 0,
          };
        }

        if (item.mutation_type === "masuk") {
          harianresult[date].total_pemasukan += amount;
          total_pemasukan += amount;
        } else if (item.mutation_type === "keluar") {
          harianresult[date].total_pengeluaran += amount;
          total_pengeluaran += amount;
        }
      });
    }

    // Mengubah objek harianresult menjadi array berurutan
    const resultArray = Object.values(harianresult).sort((a, b) =>
      a.tanggal.localeCompare(b.tanggal)
    );

    return res.status(200).json({
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
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan saat mengambil data jumlah mutasi",
      error: error.message,
    });
  }
};

module.exports = getJumlahMutasiHandler;


