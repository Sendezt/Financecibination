const { Account, Finance } = require("../../models");
const { DateTime } = require("luxon");
const { Op } = require("sequelize");

/**
 * Singkatan nama bulan dalam bahasa Indonesia
 */
const ID_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

/**
 * Helper untuk format label tanggal Indonesia (e.g. "06 Sep", "10 Agu")
 */
const getIndonesianLabel = (dt) => {
  const day = String(dt.day).padStart(2, "0");
  const month = ID_MONTHS[dt.month - 1];
  return `${day} ${month}`;
};

/**
 * Helper untuk format mata uang Rupiah
 */
const formatRupiah = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace("Rp", "Rp ");
};

/**
 * Handler untuk Chart Tren Saldo & Mutasi per Akun/Rekening
 * GET /api/mutasi/chart-tren-saldo/:accountId
 * GET /api/mutasi/account/:accountId/chart-tren-saldo
 *
 * Query params:
 *   - range: "7d" | "30d" | "month" (default: "30d")
 */
const chartTrenSaldoAccountHandler = async (req, res) => {
  const user_id = req.user?.id;
  const accountId = req.params.accountId || req.params.id;

  try {
    // 1. VALIDASI USER
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
    }

    // 2. VALIDASI PARAMETER REKENING
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "ID rekening wajib disertakan",
      });
    }

    // 3. CARI REKENING & PASTIKAN MILIK USER TERSEBUT
    const account = await Account.findOne({
      where: {
        id: accountId,
        user_id,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Rekening tidak ditemukan atau bukan milik Anda",
      });
    }

    // 4. PARSING PERIODE RENTANG WAKTU
    const rawRange = (req.query.range || "30d").toLowerCase();
    const now = DateTime.now().setZone("Asia/Jakarta");
    const today = now.startOf("day");
    const todayEnd = now.endOf("day");

    let startDate;
    let periodKey = "30d";
    let periodLabel = "30 hari";

    if (rawRange === "7d" || rawRange === "7hari" || rawRange === "7") {
      startDate = today.minus({ days: 6 });
      periodKey = "7d";
      periodLabel = "7 hari";
    } else if (rawRange === "month" || rawRange === "bulan-ini" || rawRange === "1m" || rawRange === "bulan_ini") {
      startDate = now.startOf("month");
      periodKey = "month";
      periodLabel = "bulan ini";
    } else {
      // Default: 30 hari
      startDate = today.minus({ days: 29 });
      periodKey = "30d";
      periodLabel = "30 hari";
    }

    const startDateUTC = startDate.toUTC().toJSDate();
    const endDateUTC = todayEnd.toUTC().toJSDate();

    // 5. QUERY MUTASI TRANSAKSI FINANCE UNTUK REKENING INI
    const finances = await Finance.findAll({
      where: {
        account_id: account.id,
        created_at: {
          [Op.between]: [startDateUTC, endDateUTC],
        },
      },
      attributes: ["amount", "mutation_type", "created_at"],
      order: [["created_at", "ASC"]],
      raw: true,
    });

    // 6. GROUP TRANSAKSI BERDASARKAN HARI (Asia/Jakarta)
    const dayMap = new Map();

    finances.forEach((item) => {
      const dt = DateTime.fromJSDate(new Date(item.created_at)).setZone("Asia/Jakarta");
      const dateKey = dt.toFormat("yyyy-MM-dd");
      const amount = parseFloat(item.amount) || 0;

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { masuk: 0, keluar: 0 });
      }

      const current = dayMap.get(dateKey);
      if (item.mutation_type === "masuk") {
        current.masuk += amount;
      } else if (item.mutation_type === "keluar") {
        current.keluar += amount;
      }
    });

    // 7. SUSUN ARRAY HARIAN LENGKAP
    const totalDays = Math.round(today.diff(startDate, "days").days) + 1;
    const dailyData = [];

    for (let i = 0; i < totalDays; i++) {
      const currDate = startDate.plus({ days: i });
      const dateStr = currDate.toFormat("yyyy-MM-dd");
      const daySummary = dayMap.get(dateStr) || { masuk: 0, keluar: 0 };
      const net = daySummary.masuk - daySummary.keluar;

      dailyData.push({
        date: dateStr,
        label: getIndonesianLabel(currDate),
        saldo: 0,
        masuk: daySummary.masuk,
        keluar: daySummary.keluar,
        net: net,
      });
    }

    // 8. HITUNG SALDO HARIAN (RUNNING BALANCE SECARA MUNDUR DARI SALDO SAAT INI)
    let currentRunningSaldo = Number(account.saldo);
    dailyData[dailyData.length - 1].saldo = currentRunningSaldo;

    for (let i = dailyData.length - 2; i >= 0; i--) {
      // Saldo akhir hari ke-i = Saldo akhir hari ke-(i+1) dikurangi pergerakan bersih hari ke-(i+1)
      currentRunningSaldo = currentRunningSaldo - dailyData[i + 1].net;
      dailyData[i].saldo = currentRunningSaldo;
    }

    // 9. HITUNG STATISTIK TITIK TERENDAH, TERTINGGI & PERTUMBUHAN
    const saldos = dailyData.map((d) => d.saldo);
    const minSaldo = Math.min(...saldos);
    const maxSaldo = Math.max(...saldos);

    const startSaldo = dailyData[0].saldo;
    const endSaldo = dailyData[dailyData.length - 1].saldo;
    const growthAmount = endSaldo - startSaldo;

    let growthPercentage = 0;
    if (startSaldo !== 0) {
      growthPercentage = (growthAmount / Math.abs(startSaldo)) * 100;
    } else if (endSaldo > 0) {
      growthPercentage = 100;
    } else if (endSaldo < 0) {
      growthPercentage = -100;
    }

    let status = "stabil";
    let sign = "";
    if (growthAmount > 0) {
      status = "tumbuh";
      sign = "+";
    } else if (growthAmount < 0) {
      status = "turun";
      sign = "";
    }

    const formattedGrowthPercentage = `${sign}${growthPercentage.toFixed(1)}%`;
    const growthLabel =
      status === "tumbuh"
        ? `Tumbuh ${formattedGrowthPercentage} dalam ${periodLabel}`
        : status === "turun"
        ? `Turun ${formattedGrowthPercentage} dalam ${periodLabel}`
        : `Stabil 0.0% dalam ${periodLabel}`;

    // 10. RESPONSE JSON
    return res.status(200).json({
      success: true,
      message: `Data tren saldo rekening ${account.name} (${periodLabel}) berhasil diambil`,
      account: {
        id: account.id,
        name: account.name,
        current_saldo: Number(account.saldo),
      },
      stats: {
        min_saldo: minSaldo,
        formatted_min_saldo: formatRupiah(minSaldo),
        max_saldo: maxSaldo,
        formatted_max_saldo: formatRupiah(maxSaldo),
        start_saldo: startSaldo,
        formatted_start_saldo: formatRupiah(startSaldo),
        end_saldo: endSaldo,
        formatted_end_saldo: formatRupiah(endSaldo),
        growth_amount: growthAmount,
        formatted_growth_amount: `${sign}${formatRupiah(Math.abs(growthAmount))}`,
        growth_percentage: Number(growthPercentage.toFixed(2)),
        status,
        growth_label: growthLabel,
      },
      data: dailyData,
      meta: {
        period: {
          range: periodKey,
          label: periodLabel,
          from: startDate.toFormat("yyyy-MM-dd"),
          to: today.toFormat("yyyy-MM-dd"),
          total_days: totalDays,
        },
      },
    });
  } catch (error) {
    console.error("Chart Tren Saldo Account Error:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data tren saldo rekening",
    });
  }
};

module.exports = chartTrenSaldoAccountHandler;
