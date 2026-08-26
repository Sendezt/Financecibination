const bcrypt = require("bcryptjs");
const Pengguna = require("../../models/Pengguna");

const registerHandler = async (req, res) => {
  const { full_name, email, password, wa_number } = req.body;

  try {
    if (!email || !password || !wa_number) {
      return res.status(400).json({
        status: false,
        message: "Email, password, dan nomor WhatsApp wajib diisi",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: false,
        message: "Password minimal 6 karakter",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const pengguna = await Pengguna.create({
      full_name,
      email,
      password: hashedPassword,
      wa_number,
    });

    return res.status(201).json({
      status: true,
      message: "User registered successfully",
      data: {
        id: pengguna.id,
        full_name: pengguna.full_name,
        email: pengguna.email,
        wa_number: pengguna.wa_number,
        role: pengguna.role,
        created_at: pengguna.created_at,
      },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      // Mengetahui field mana yang duplikat
      const field = error.errors?.[0]?.path;

      let message = "Data sudah terdaftar";

      if (field === "email") {
        message = "Email sudah terdaftar";
      }

      if (field === "wa_number") {
        message = "Nomor WhatsApp sudah terdaftar";
      }

      return res.status(400).json({
        status: false,
        message,
      });
    }

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        status: false,
        message: error.errors[0].message,
      });
    }

    console.error("Error registering user:", error);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

module.exports = registerHandler;
