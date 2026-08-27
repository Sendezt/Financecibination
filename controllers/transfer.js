// Import Sequelize models
const {
  Account,
  Transfer,
  Finance,
  sequelize,
} = require("../models");

const transferHandler = async (req, res) => {
  // Ambil user_id dari token yang sudah diverifikasi
  const user_id = req.user?.id;

  // Ambil data dari body request
  const {
    from_account_id,
    to_account_id,
    amount,
    deskripsi,
  } = req.body;

  // =========================
  // VALIDASI INPUT
  // =========================

  if (!from_account_id || !to_account_id || !amount || !user_id) {
    return res.status(400).json({
      status: false,
      message:
        "ID rekening asal, ID rekening tujuan, jumlah dan user ID wajib diisi.",
    });
  }

  if (from_account_id === to_account_id) {
    return res.status(400).json({
      status: false,
      message: "Rekening asal dan rekening tujuan tidak boleh sama.",
    });
  }

  const nominal = Number(amount);

  if (!Number.isFinite(nominal) || nominal <= 0) {
    return res.status(400).json({
      status: false,
      message: "Jumlah transfer harus lebih dari 0.",
    });
  }

  // =========================
  // MULAI TRANSACTION
  // =========================

  const transaction = await sequelize.transaction();

  try {
    // =========================
    // CARI REKENING PENGIRIM
    // =========================

    const fromAccount = await Account.findOne({
      where: {
        id: from_account_id,
        user_id,
      },
      transaction,
    });

    if (!fromAccount) {
      await transaction.rollback();

      return res.status(404).json({
        status: false,
        message:
          "Rekening asal tidak ditemukan atau bukan milik user.",
      });
    }

    // =========================
    // CARI REKENING PENERIMA
    // =========================

    const toAccount = await Account.findOne({
      where: {
        id: to_account_id,
        user_id,
      },
      transaction,
    });

    if (!toAccount) {
      await transaction.rollback();

      return res.status(404).json({
        status: false,
        message:
          "Rekening tujuan tidak ditemukan atau bukan milik user.",
      });
    }

    // =========================
    // CEK SALDO
    // =========================

    if (Number(fromAccount.saldo) < nominal) {
      await transaction.rollback();

      return res.status(400).json({
        status: false,
        message: "Saldo rekening asal tidak mencukupi.",
      });
    }

    // =========================
    // KURANGI SALDO PENGIRIM
    // =========================

    await fromAccount.decrement("saldo", {
      by: nominal,
      transaction,
    });

    // =========================
    // TAMBAH SALDO PENERIMA
    // =========================

    await toAccount.increment("saldo", {
      by: nominal,
      transaction,
    });

    // =========================
    // BUAT RECORD TRANSFER
    // =========================

    const transfer = await Transfer.create(
      {
        user_id,
        from_account_id,
        to_account_id,
        amount: nominal,
        deskripsi: deskripsi || null,
      },
      {
        transaction,
      }
    );

    // =========================
    // BUAT FINANCE - PENGIRIM
    // =========================

    await Finance.create(
      {
        account_id: from_account_id,
        amount: nominal,
        mutation_type: "keluar",
        transaction_type: "transfer",
        transfer_id: transfer.id,
        note: deskripsi || null,
      },
      {
        transaction,
      }
    );

    // =========================
    // BUAT FINANCE - PENERIMA
    // =========================

    await Finance.create(
      {
        account_id: to_account_id,
        amount: nominal,
        mutation_type: "masuk",
        transaction_type: "transfer",
        transfer_id: transfer.id,
        note: deskripsi || null,
      },
      {
        transaction,
      }
    );

    // =========================
    // COMMIT
    // =========================

    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Transfer berhasil dilakukan",
      data: {
        id: transfer.id,
        from_account: fromAccount.name,
        to_account: toAccount.name,
        amount: nominal,
        deskripsi: transfer.deskripsi,
        created_at: transfer.created_at,
      },
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Transfer Error:", error);

    return res.status(500).json({
      status: false,
      message: "Gagal melakukan transfer",
      error: error.message,
    });
  }
};

module.exports = transferHandler;