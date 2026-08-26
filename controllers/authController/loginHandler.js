const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Pengguna = require("../../models/Pengguna");

const loginHandler = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Email dan password wajib diisi",
      });
    }

    // Cari user berdasarkan email
    const user = await Pengguna.findOne({
      where: {
        email,
      },
    });

    // User tidak ditemukan
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User tidak ditemukan",
      });
    }

    // Cocokkan password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Email atau password salah",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      },
    );

    return res.status(200).json({
      status: true,
      message: "Login berhasil",
      token,
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        wa_number: user.wa_number,
      },
    });
  } catch (error) {
    console.error("Error login:", error);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

module.exports = loginHandler;
