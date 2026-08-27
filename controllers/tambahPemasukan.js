const { Account, Finance, sequelize } = require("../models");

const tambahPemasukanHandler = async (req, res) => {
  const { name, amount, note, created_at } = req.body;
  const user_id = req.user?.id;

  const transaction = await sequelize.transaction();

  try {
    /**
     * VALIDASI
     */

    if (!name || !amount || !user_id) {
      await transaction.rollback();

      return res.status(400).json({
        status: false,
        message: "Nama rekening, jumlah, dan user wajib diisi.",
      });
    }

    const nominal = Number(amount);

    if (!Number.isFinite(nominal) || nominal <= 0) {
      await transaction.rollback();

      return res.status(400).json({
        status: false,
        message: "Jumlah pemasukan harus lebih dari 0.",
      });
    }

    /**
     * CARI ACCOUNT
     */

    const account = await Account.findOne({
      where: {
        name,
        user_id,
      },
      transaction,
    });

    if (!account) {
      await transaction.rollback();

      return res.status(404).json({
        status: false,
        message:
          "Rekening tidak ditemukan atau bukan milik user.",
      });
    }

    /**
     * TAMBAHKAN DATA FINANCE
     */

    const finance = await Finance.create(
      {
        account_id: account.id,
        amount: nominal,
        mutation_type: "masuk",
        transaction_type: "income",
        note,
        created_at: created_at || new Date(),
      },
      {
        transaction,
      },
    );

    /**
     * UPDATE SALDO
     */

    await account.increment(
      "saldo",
      {
        by: nominal,
        transaction,
      },
    );

    /**
     * COMMIT
     */

    await transaction.commit();

    return res.status(201).json({
      status: true,
      message: "Pemasukan berhasil ditambahkan",
      data: {
        id: finance.id,
        amount: finance.amount,
        note: finance.note,
        created_at: finance.created_at,
      },
    });
  } catch (error) {
    await transaction.rollback();

    console.error(
      "Tambah Pemasukan Error:",
      error,
    );

    return res.status(500).json({
      status: false,
      message: "Gagal menambahkan pemasukan",
      error: error.message,
    });
  }
};

module.exports = tambahPemasukanHandler;