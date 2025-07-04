const supabase = require("../middleware/supabaseClient");

const getSaldoByUserIdHandler = async (req, res) => {
  const user_id = req.user?.id;

  try {
    if (!user_id) {
      return res.status(401).json({ message: "User tidak terautentikasi." });
    }

    // Ambil semua akun user
    const { data: accounts, error: accError } = await supabase
      .from("accounts")
      .select("id, name, saldo, last_updated")
      .eq("user_id", user_id);

    if (accError) {
      console.error("Error ambil akun:", accError);
      return res.status(500).json({ message: "Gagal ambil akun." });
    }

    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ message: "Tidak ada akun ditemukan." });
    }

    const saldoPerAccount = {};
    const accountIds = accounts.map((acc) => acc.id);
    const now = new Date().toISOString();

    accounts.forEach((account) => {
      saldoPerAccount[account.id] = {
        account_id: account.id,
        account_name: account.name || "Tidak diketahui",
        total_masuk: 0,
        total_keluar: 0,
        saldo_awal: parseFloat(account.saldo) || 0,
        saldo_akhir: parseFloat(account.saldo) || 0,
        last_updated: account.last_updated || "1970-01-01",
      };
    });

    // Ambil SEMUA transaksi untuk semua akun sekaligus
    const { data: financeData, error: financeError } = await supabase
      .from("finance")
      .select("account_id, amount, mutation_type, created_at")
      .in("account_id", accountIds);

    if (financeError) {
      console.error("Error ambil transaksi:", financeError);
      return res.status(500).json({ message: "Gagal ambil transaksi." });
    }

    // Proses semua transaksi
    financeData?.forEach((item) => {
      const acc = saldoPerAccount[item.account_id];
      if (!acc) return;

      if (item.created_at <= acc.last_updated) return;

      const amount = parseFloat(item.amount) || 0;
      if (item.mutation_type === "masuk") {
        acc.total_masuk += amount;
        acc.saldo_akhir += amount;
      } else if (item.mutation_type === "keluar") {
        acc.total_keluar += amount;
        acc.saldo_akhir -= amount;
      }
    });

    // Update saldo jika berubah
    for (const accId in saldoPerAccount) {
      const acc = saldoPerAccount[accId];
      if (acc.saldo_awal !== acc.saldo_akhir) {
        const { error: updateError } = await supabase
          .from("accounts")
          .update({
            saldo: acc.saldo_akhir,
            last_updated: now,
          })
          .eq("id", accId);

        if (updateError) {
          console.error(`Update gagal akun ${accId}:`, updateError);
        } else {
          acc.last_updated = now;
        }
      }
    }

    // Kirim ke client
    const responseData = Object.values(saldoPerAccount).map((acc) => ({
      account_id: acc.account_id,
      account_name: acc.account_name,
      total_masuk: acc.total_masuk,
      total_keluar: acc.total_keluar,
      saldo: acc.saldo_akhir,
    }));

    res.status(200).json({
      status: true,
      message: "Data saldo berhasil diambil",
      data: responseData,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

module.exports = getSaldoByUserIdHandler;
