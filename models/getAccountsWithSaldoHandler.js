const supabase = require("../middleware/supabaseClient");

const getAccountsWithSaldoHandler = async (req, res) => {
  const user_id = req.user?.id;

  try {
    if (!user_id) {
      return res.status(401).json({ message: "User tidak terautentikasi." });
    }

    // Ambil semua akun milik user
    const { data: accounts, error: accError } = await supabase
      .from("accounts")
      .select("id, name, saldo, last_updated")
      .eq("user_id", user_id);

    if (accError) {
      console.error("Error saat mengambil data akun:", accError);
      return res.status(500).json({ message: "Gagal mengambil data akun" });
    }

    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ message: "Tidak ada akun ditemukan." });
    }

    const accountIds = accounts.map((acc) => acc.id);

    // Ambil semua transaksi untuk semua akun sekaligus
    const { data: allFinance, error: allFinError } = await supabase
      .from("finance")
      .select("account_id, amount, mutation_type, created_at")
      .in("account_id", accountIds);

    if (allFinError) {
      console.error("Error saat mengambil transaksi:", allFinError);
      return res.status(500).json({ message: "Gagal mengambil transaksi" });
    }

    const saldoPerAccount = {};
    const now = new Date().toISOString();

    accounts.forEach((account) => {
      const accountId = account.id;
      const lastUpdated = account.last_updated || "1970-01-01";
      const transaksiBaru = allFinance?.filter(
        (tx) => tx.account_id === accountId && tx.created_at > lastUpdated
      ) || [];

      let saldo_akhir = parseFloat(account.saldo) || 0;

      transaksiBaru.forEach((item) => {
        const amount = parseFloat(item.amount) || 0;
        if (item.mutation_type === "masuk") saldo_akhir += amount;
        else if (item.mutation_type === "keluar") saldo_akhir -= amount;
      });

      saldoPerAccount[accountId] = {
        account_id: accountId,
        account_name: account.name || "Tidak diketahui",
        saldo_awal: parseFloat(account.saldo) || 0,
        saldo_akhir,
        last_updated: transaksiBaru.length > 0 ? now : account.last_updated,
      };
    });

    // Update saldo jika berubah
    for (const accId in saldoPerAccount) {
      const { saldo_awal, saldo_akhir, last_updated } = saldoPerAccount[accId];
      if (saldo_awal !== saldo_akhir) {
        const { error: updateError } = await supabase
          .from("accounts")
          .update({
            saldo: saldo_akhir,
            last_updated,
          })
          .eq("id", accId);

        if (updateError) {
          console.error(`Gagal update saldo akun ${accId}:`, updateError);
        }
      }
    }

    // Response ke frontend
    const responseData = Object.values(saldoPerAccount).map((account) => ({
      account_id: account.account_id,
      account_name: account.account_name,
      saldo: account.saldo_akhir,
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
