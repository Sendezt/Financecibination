const Pengguna = require("../../models/Pengguna");

/**
 * PUT /api/auth/complete-profile
 *
 * Melengkapi profil pengguna yang register via Google OAuth.
 * Minimal mengisi wa_number. full_name bersifat opsional jika ingin diupdate.
 */
const completeProfileHandler = async (req, res) => {
  const userId = req.user.id;
  const { wa_number, full_name } = req.body;

  if (!wa_number) {
    return res.status(400).json({
      status: false,
      message: "wa_number wajib diisi",
    });
  }

  // Validasi format: minimal 9 digit, hanya angka (boleh diawali +)
  const waRegex = /^\+?[0-9]{9,15}$/;
  if (!waRegex.test(wa_number)) {
    return res.status(400).json({
      status: false,
      message: "Format nomor WhatsApp tidak valid",
    });
  }

  try {
    const user = await Pengguna.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Pengguna tidak ditemukan",
      });
    }

    // Cek apakah wa_number sudah dipakai akun lain
    const existing = await Pengguna.findOne({
      where: { wa_number },
    });

    if (existing && existing.id !== userId) {
      return res.status(400).json({
        status: false,
        message: "Nomor WhatsApp sudah digunakan oleh akun lain",
      });
    }

    // Siapkan data yang di-update
    const updateData = { wa_number };
    if (full_name && full_name.trim() !== "") {
      updateData.full_name = full_name.trim();
    }

    await user.update(updateData);

    return res.status(200).json({
      status: true,
      message: "Profil berhasil dilengkapi",
      is_profile_complete: true,
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        wa_number: user.wa_number,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        status: false,
        message: "Nomor WhatsApp sudah digunakan oleh akun lain",
      });
    }

    console.error("Error completeProfileHandler:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

module.exports = completeProfileHandler;
