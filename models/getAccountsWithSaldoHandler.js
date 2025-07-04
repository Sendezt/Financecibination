const supabase = require("../middleware/supabaseClient");

const getAccountsWithSaldoHandler = async (req, res) => {
  const user_id = req.user?.id;

  try {
    if (!user_id) {
      return res.status(401).json({ message: "User tidak terautentikasi." });
    }

    // 1. Ambil semua akun milik user
    const { data: accounts, error: accError } = await supabase
      .from("accounts")
      .select("id, name, saldo, last_updated")
      .eq("user_id", user_id);

    if (accError) {
      console.error("Gagal mengambil akun:", accError);
      return res.status(500).json({ message: "Gagal mengambil data akun" });
    }

    if (!accounts?.length) {
      return res.status(404).json({ message: "Tidak ada akun ditemukan." });
    }

    const now = new Date().toISOString();
    const accountMap = new Map();
    const accountIds = [];

    // 2. Siapkan data awal
    accounts.forEach((acc) => {
      accountIds.push(acc.id);
      accountMap.set(acc.id, {
        account_id: acc.id,
        account_name: acc.name || "Tidak diketahui",
        saldo_awal: parseFloat(acc.saldo) || 0,
        saldo_akhir: parseFloat(acc.saldo) || 0,
        last_updated: acc.last_updated || "1970-01-01",
        has_update: false,
      });
    });

    // 3. Ambil semua transaksi terkait akun-akun tersebut
    const { data: financeData, error: finError } = await supabase
      .from("finance")
      .select("account_id, amount, mutation_type, created_at")
      .in("account_id", accountIds);

    if (finError) {
      console.error("Gagal mengambil transaksi:", finError);
      return res.status(500).json({ message: "Gagal mengambil transaksi" });
    }

    // 4. Proses semua transaksi (1 kali loop)
    for (const item of financeData || []) {
      const acc = accountMap.get(item.account_id);
      if (!acc || item.created_at <= acc.last_updated) continue;

      const amount = parseFloat(item.amount) || 0;
      if (item.mutation_type === "masuk") {
        acc.saldo_akhir += amount;
      } else if (item.mutation_type === "keluar") {
        acc.saldo_akhir -= amount;
      }
      acc.has_update = true;
    }

    // 5. Update saldo ke database jika berubah
    for (const [accId, acc] of accountMap) {
      if (acc.has_update && acc.saldo_awal !== acc.saldo_akhir) {
        const { error: updateError } = await supabase
          .from("accounts")
          .update({
            saldo: acc.saldo_akhir,
            last_updated: now,
          })
          .eq("id", accId);

        if (updateError) {
          console.error(`Gagal update saldo akun ${accId}:`, updateError);
        } else {
          acc.last_updated = now;
        }
      }
    }

    // 6. Format response
    const responseData = Array.from(accountMap.values()).map((acc) => ({
      account_id: acc.account_id,
      account_name: acc.account_name,
      saldo: acc.saldo_akhir,
    }));

    res.status(200).json({
      status: true,
      message: "Data rekening berhasil diambil",
      data: responseData,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

module.exports = getAccountsWithSaldoHandler;
