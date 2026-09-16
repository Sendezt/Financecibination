// controllers/updateSaldoHandler.js
const { Account, Finance, sequelize } = require("../models");

const updateSaldoHandler = async (req, res) => {
  const user_id = req.user?.id;
  const {
    account_id,
    name,
    account_name,
    saldo,
    new_saldo,
    saldo_terbaru,
    note,
    created_at,
  } = req.body;

  // 1. VALIDASI USER
  if (!user_id) {
    return res.status(401).json({
      status: false,
      message: "User tidak terautentikasi.",
    });
  }

  // 2. VALIDASI REKENING IDENTIFIER
  const targetAccountId = account_id;
  const targetAccountName = name || account_name;

  if (!targetAccountId && !targetAccountName) {
    return res.status(400).json({
      status: false,
      message: "ID rekening (account_id) atau nama rekening (name) wajib diisi.",
    });
  }

  // 3. VALIDASI SALDO TERBARU
  const inputSaldo =
    new_saldo !== undefined
      ? new_saldo
      : saldo !== undefined
      ? saldo
      : saldo_terbaru;

  if (inputSaldo === undefined || inputSaldo === null || inputSaldo === "") {
    return res.status(400).json({
      status: false,
      message: "Saldo terbaru wajib diisi.",
    });
  }

  const nominalSaldoBaru = Number(inputSaldo);

  if (!Number.isFinite(nominalSaldoBaru) || nominalSaldoBaru < 0) {
    return res.status(400).json({
      status: false,
      message: "Saldo terbaru harus berupa angka valid dan tidak boleh kurang dari 0.",
    });
  }

  // 4. DATABASE TRANSACTION
  const transaction = await sequelize.transaction();

  try {
    // Cari rekening milik user dengan locking
    const whereClause = { user_id };
    if (targetAccountId) {
      whereClause.id = targetAccountId;
    } else {
      whereClause.name = targetAccountName;
    }

    const account = await Account.findOne({
      where: whereClause,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!account) {
      await transaction.rollback();
      return res.status(404).json({
        status: false,
        message: "Rekening tidak ditemukan atau bukan milik user.",
      });
    }

    const currentSaldo = Number(account.saldo);
    const diff = nominalSaldoBaru - currentSaldo;

    // Jika saldo tidak berubah
    if (diff === 0) {
      await transaction.rollback();
      return res.status(400).json({
        status: false,
        message: "Saldo terbaru sama dengan saldo saat ini. Tidak ada perubahan saldo.",
      });
    }

    // Tentukan tipe transaksi & mutasi
    const isIncome = diff > 0;
    const amount = Number(Math.abs(diff).toFixed(2));
    const mutation_type = isIncome ? "masuk" : "keluar";
    const transaction_type = isIncome ? "income" : "expense";

    // Catat mutasi finance
    const finance = await Finance.create(
      {
        account_id: account.id,
        amount,
        mutation_type,
        transaction_type,
        note: note || null,
        created_at: created_at || new Date(),
      },
      { transaction }
    );

    // Update saldo rekening
    account.saldo = nominalSaldoBaru;
    account.last_updated = new Date();
    await account.save({ transaction });

    // Commit transaction
    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: `Saldo berhasil diperbarui. Tercatat mutasi ${mutation_type} (${transaction_type}).`,
      data: {
        account: {
          id: account.id,
          name: account.name,
          previous_saldo: currentSaldo,
          current_saldo: nominalSaldoBaru,
        },
        mutation: {
          id: finance.id,
          amount: Number(finance.amount),
          mutation_type: finance.mutation_type,
          transaction_type: finance.transaction_type,
          note: finance.note,
          created_at: finance.created_at,
        },
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Update Saldo Error:", error);

    return res.status(500).json({
      status: false,
      message: "Gagal memperbarui saldo",
      error: error.message,
    });
  }
};

module.exports = updateSaldoHandler;
