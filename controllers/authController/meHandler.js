const Pengguna = require("../../models/Pengguna");

/**
 * GET /api/auth/me
 *
 * Mengembalikan data user yang sedang login berdasarkan JWT di HttpOnly cookie.
 * req.user sudah di-set oleh middleware verifyToken sebelum handler ini dipanggil.
 */
const meHandler = async (req, res) => {
  try {
    const user = await Pengguna.findOne({
      where: { id: req.user.id },
      attributes: ["id", "full_name", "email", "wa_number", "role", "avatar_url"],
    });

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      status: true,
      data: {
        full_name: user.full_name,
        wa_number: user.wa_number,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Error meHandler:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

module.exports = meHandler;
