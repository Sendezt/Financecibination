/**
 * POST /api/auth/logout
 *
 * Menghapus HttpOnly cookie token sehingga user tidak lagi authenticated.
 */
const logoutHandler = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 0, // Hapus cookie segera
  });

  return res.status(200).json({
    status: true,
    message: "Logged out successfully",
  });
};

module.exports = logoutHandler;
