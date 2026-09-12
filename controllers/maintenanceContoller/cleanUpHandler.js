const { sequelize, FinanceArchive, TransferArchive } = require("../../models");
const { Op } = require("sequelize");

const cleanUpHandler = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Tentukan cutoff date (default 3 tahun yang lalu atau berdasarkan query params days)
    const days = Number(req.query.days);
    const cutoffDate = new Date();

    if (Number.isInteger(days) && days > 0) {
      cutoffDate.setDate(cutoffDate.getDate() - days);
    } else {
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 3);
    }

    /**
     * Hapus data arsip yang lebih lama dari cutoff date.
     * Hapus FinanceArchive terlebih dahulu untuk menjaga integritas foreign key ke TransferArchive.
     */
    const deletedFinanceCount = await FinanceArchive.destroy({
      where: {
        created_at: {
          [Op.lt]: cutoffDate,
        },
      },
      transaction,
    });

    const deletedTransferCount = await TransferArchive.destroy({
      where: {
        created_at: {
          [Op.lt]: cutoffDate,
        },
      },
      transaction,
    });

    await transaction.commit();

    const totalDeleted = deletedFinanceCount + deletedTransferCount;

    return res.status(200).json({
      status: true,
      message:
        Number.isInteger(days) && days > 0
          ? `Data arsip yang lebih dari ${days} hari berhasil dihapus`
          : "Data arsip yang lebih dari 3 tahun berhasil dihapus",
      cutoff_date: cutoffDate.toISOString(),
      deleted_rows: totalDeleted,
      details: {
        finance_archive: deletedFinanceCount,
        transfer_archive: deletedTransferCount,
      },
    });
  } catch (err) {
    await transaction.rollback();

    console.error("CleanUp Handler Error:", err);

    return res.status(500).json({
      status: false,
      message: "Gagal menghapus data lama dari arsip",
      error: err.message,
    });
  }
};

module.exports = cleanUpHandler;
