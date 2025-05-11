const supabase = require("../middleware/supabaseClient");

const getAccountsWithSaldoHandler = async (req, res) => {
  const user_id = req.user?.id;

  try {
    if (!user_id) {
      return res.status(401).json({ message: "User tidak terautentikasi." });
    }

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

    const saldoPerAccount = {};

    accounts.forEach((account) => {
      saldoPerAccount[account.id] = {
        account_id: account.id,
        account_name: account.name || "Tidak diketahui",
        saldo_awal: parseFloat(account.saldo) || 0,
        saldo_akhir: parseFloat(account.saldo) || 0,
        last_updated: account.last_updated,
      };
    });

    const accountIds = Object.keys(saldoPerAccount);

    for (const accountId of accountIds) {
      const lastUpdated =
        saldoPerAccount[accountId].last_updated || "1970-01-01";

      const { data: finance, error: finError } = await supabase
        .from("finance")
        .select("amount, mutation_type, created_at")
        .eq("account_id", accountId)
        .gt("created_at", lastUpdated);

      if (finError) {
        console.error(
          `Error saat mengambil transaksi untuk akun ${accountId}:`,
          finError
        );
        continue;
      }

      if (finance && finance.length > 0) {
        finance.forEach((item) => {
          const amount = parseFloat(item.amount) || 0;
          if (item.mutation_type === "masuk") {
            saldoPerAccount[accountId].saldo_akhir += amount;
          } else if (item.mutation_type === "keluar") {
            saldoPerAccount[accountId].saldo_akhir -= amount;
          }
        });

        const now = new Date().toISOString();
        const { error: updateError } = await supabase
          .from("accounts")
          .update({
            saldo: saldoPerAccount[accountId].saldo_akhir,
            last_updated: now,
          })
          .eq("id", accountId);

        if (updateError) {
          console.error(`Gagal update saldo akun ${accountId}:`, updateError);
        } else {
          saldoPerAccount[accountId].last_updated = now;
        }
      }
    }

    // Hanya kirim data yang diperlukan
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
