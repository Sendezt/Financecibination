const supabase = require("../middleware/supabaseClient");

const getSaldoByUserIdHandler = async (req, res) => {
  const { user_id } = req.query;

  try {
    if (!user_id) {
      return res.status(400).json({ message: "User ID wajib diisi." });
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

    const accountIdToName = {};
    const saldoPerAccount = {};
    
    // Siapkan data akun dan saldo awal
    accounts.forEach(account => {
      accountIdToName[account.id] = account.name;
      saldoPerAccount[account.id] = {
        account_id: account.id,
        account_name: account.name || "Tidak diketahui",
        total_masuk: 0,
        total_keluar: 0,
        saldo_awal: parseFloat(account.saldo) || 0, // Simpan saldo awal
        saldo_akhir: parseFloat(account.saldo) || 0, // Inisialisasi saldo akhir dengan saldo awal
        last_updated: account.last_updated
      };
    });

    const accountIds = Object.keys(accountIdToName);

    // Untuk setiap akun, ambil transaksi terbaru setelah last_updated
    for (const accountId of accountIds) {
      const lastUpdated = saldoPerAccount[accountId].last_updated || "1970-01-01";
      
      const { data: finance, error: finError } = await supabase
        .from("finance")
        .select("account_id, amount, mutation_type, created_at")
        .eq("account_id", accountId)
        .gt("created_at", lastUpdated);

      if (finError) {
        console.error(`Error saat mengambil transaksi untuk akun ${accountId}:`, finError);
        continue; // Lanjutkan ke akun berikutnya jika terjadi error
      }

      if (finance && finance.length > 0) {
        // Hitung perubahan saldo dari transaksi baru
        finance.forEach(item => {
          const amount = parseFloat(item.amount) || 0;
          
          if (item.mutation_type === "masuk") {
            saldoPerAccount[accountId].total_masuk += amount;
            saldoPerAccount[accountId].saldo_akhir += amount;
          } else if (item.mutation_type === "keluar") {
            saldoPerAccount[accountId].total_keluar += amount;
            saldoPerAccount[accountId].saldo_akhir -= amount; // Kurangi saldo untuk pengeluaran
          }
        });

        // Update saldo dan last_updated di database
        const now = new Date().toISOString();
        const { error: updateError } = await supabase
          .from("accounts")
          .update({
            saldo: saldoPerAccount[accountId].saldo_akhir,
            last_updated: now
          })
          .eq("id", accountId);

        if (updateError) {
          console.error(`Error saat memperbarui saldo akun ${accountId}:`, updateError);
        } else {
          // Update last_updated di data response jika berhasil
          saldoPerAccount[accountId].last_updated = now;
        }
      }
    }

    // Format respons akhir
    const responseData = Object.values(saldoPerAccount).map(account => ({
      account_id: account.account_id,
      account_name: account.account_name,
      total_masuk: account.total_masuk,
      total_keluar: account.total_keluar,
      saldo: account.saldo_akhir
    }));

    res.status(200).json({
      status: true,
      message: "Data saldo per akun",
      data: responseData
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = getSaldoByUserIdHandler;