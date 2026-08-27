const { Op } = require("sequelize");
const { Transfer, Account } = require("../models");

const riwayatTransferHandler = async (req, res) => {
  const user_id = req.user?.id;

  // =========================
  // VALIDASI USER
  // =========================

  if (!user_id) {
    return res.status(401).json({
      status: false,
      message: "User tidak terautentikasi.",
    });
  }

  // =========================
  // BATAS 28 HARI TERAKHIR
  // =========================

  const now = new Date();

  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  try {
    // =========================
    // AMBIL RIWAYAT TRANSFER
    // =========================

    const data = await Transfer.findAll({
      where: {
        user_id,
        created_at: {
          [Op.gte]: fourWeeksAgo,
        },
      },

      attributes: [
        "id",
        "amount",
        "deskripsi",
        "created_at",
      ],

      include: [
        {
          model: Account,
          as: "fromAccount",
          attributes: ["id", "name"],
        },
        {
          model: Account,
          as: "toAccount",
          attributes: ["id", "name"],
        },
      ],

      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      status: true,
      message: "Riwayat transfer berhasil diambil",
      data,
    });
  } catch (error) {
    console.error("Error fetching transfer history:", error);

    return res.status(500).json({
      status: false,
      message: "Gagal mengambil riwayat transfer",
    });
  }
};

module.exports = riwayatTransferHandler;