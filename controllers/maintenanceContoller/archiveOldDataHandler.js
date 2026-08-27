const { Op } = require("sequelize");

const {
    sequelize,
    Finance,
    Transfer,
    FinanceArchive,
    TransferArchive,
} = require("../../models");

const archiveOldDataHandler = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        /**
         * ==========================================
         * 1. AMBIL RETENTION DAYS
         * ==========================================
         */

        const days = Number(req.query.days) || 365;

        if (!Number.isInteger(days) || days <= 0) {
            await transaction.rollback();

            return res.status(400).json({
                status: false,
                message: "Parameter days harus berupa angka positif",
            });
        }

        /**
         * ==========================================
         * 2. TENTUKAN CUTOFF DATE
         * ==========================================
         */

        const cutoffDate = new Date();

        cutoffDate.setDate(
            cutoffDate.getDate() - days,
        );

        /**
         * ==========================================
         * 3. CARI FINANCE LAMA
         * ==========================================
         */

        const oldFinances = await Finance.findAll({
            where: {
                created_at: {
                    [Op.lt]: cutoffDate,
                },
            },

            raw: true,

            transaction,
        });

        /**
         * ==========================================
         * 4. CARI TRANSFER LAMA
         * ==========================================
         */

        const oldTransfers = await Transfer.findAll({
            where: {
                created_at: {
                    [Op.lt]: cutoffDate,
                },
            },

            raw: true,

            transaction,
        });

        /**
         * ==========================================
         * 5. ARCHIVE FINANCE
         * ==========================================
         */

        if (oldFinances.length > 0) {
            await FinanceArchive.bulkCreate(
                oldFinances,
                {
                    transaction,
                },
            );
        }

        /**
         * ==========================================
         * 6. ARCHIVE TRANSFER
         * ==========================================
         */

        if (oldTransfers.length > 0) {
            await TransferArchive.bulkCreate(
                oldTransfers,
                {
                    transaction,
                },
            );
        }

        /**
         * ==========================================
         * 7. HAPUS DATA FINANCE ASLI
         * ==========================================
         */

        if (oldFinances.length > 0) {
            await Finance.destroy({
                where: {
                    id: {
                        [Op.in]: oldFinances.map(
                            (finance) => finance.id,
                        ),
                    },
                },

                transaction,
            });
        }

        /**
         * ==========================================
         * 8. HAPUS DATA TRANSFER ASLI
         * ==========================================
         */

        if (oldTransfers.length > 0) {
            await Transfer.destroy({
                where: {
                    id: {
                        [Op.in]: oldTransfers.map(
                            (transfer) => transfer.id,
                        ),
                    },
                },

                transaction,
            });
        }

        /**
         * ==========================================
         * 9. COMMIT
         * ==========================================
         */

        await transaction.commit();

        return res.status(200).json({
            status: true,
            message: "Data lama berhasil diarsipkan",

            retention_days: days,

            cutoff_date: cutoffDate,

            archived: {
                finance: oldFinances.length,
                transfers: oldTransfers.length,
            },
        });
    } catch (error) {
        await transaction.rollback();

        console.error(
            "Archive Old Data Error:",
            error,
        );

        return res.status(500).json({
            status: false,
            message: "Gagal mengarsipkan data lama",
            error: error.message,
        });
    }
};

module.exports = archiveOldDataHandler;