const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const Pengguna = require("../../models/Pengguna");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Helper: issue JWT internal dengan payload standar
 */
const issueJWT = (user) => {
  return jwt.sign(
    {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "7d" }
  );
};

/**
 * Helper: verifikasi id_token dari Google
 * Mengembalikan payload Google jika valid, melempar error jika tidak
 */
const verifyGoogleToken = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

/**
 * POST /api/auth/google
 *
 * Alur:
 * 1. Verifikasi id_token ke Google
 * 2. Cari user by google_id → login langsung
 * 3. Cari user by email (akun lama via register biasa) → account linking + login
 * 4. Tidak ditemukan → auto-register user baru + login
 */
const googleAuthHandler = async (req, res) => {
  const { id_token } = req.body;

  if (!id_token) {
    return res.status(400).json({
      status: false,
      message: "id_token wajib dikirimkan",
    });
  }

  try {
    // Step 1: Verifikasi token ke Google
    let googlePayload;
    try {
      googlePayload = await verifyGoogleToken(id_token);
    } catch (err) {
      return res.status(401).json({
        status: false,
        message: "Token Google tidak valid atau sudah kedaluwarsa",
      });
    }

    const {
      sub: google_id,
      email,
      name: full_name,
      picture: avatar_url,
      email_verified,
    } = googlePayload;

    // Tolak jika email Google belum diverifikasi
    if (!email_verified) {
      return res.status(401).json({
        status: false,
        message: "Email Google belum diverifikasi",
      });
    }

    // Step 2: Cari user berdasarkan google_id
    let user = await Pengguna.findOne({ where: { google_id } });

    if (user) {
      // === SKENARIO 1: Login — user Google sudah terdaftar ===
      const token = issueJWT(user);

      return res.status(200).json({
        status: true,
        message: "Login dengan Google berhasil",
        is_profile_complete: !!user.wa_number,
        token,
        data: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          wa_number: user.wa_number,
        },
      });
    }

    // Step 3: Cari user berdasarkan email (akun register biasa)
    user = await Pengguna.findOne({ where: { email } });

    if (user) {
      // === SKENARIO 2: Account Linking — email sama, tautkan google_id ===
      await user.update({
        google_id,
        avatar_url: user.avatar_url || avatar_url, // jaga avatar lama jika sudah ada
      });

      const token = issueJWT(user);

      return res.status(200).json({
        status: true,
        message: "Akun berhasil ditautkan dengan Google dan login berhasil",
        is_profile_complete: !!user.wa_number,
        token,
        data: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          wa_number: user.wa_number,
        },
      });
    }

    // Step 4: Auto-register user baru dari Google
    // === SKENARIO 3: Register baru ===
    const newUser = await Pengguna.create({
      full_name,
      email,
      password: null,     // user Google tidak punya password
      wa_number: null,    // diisi kemudian via /api/auth/complete-profile
      google_id,
      avatar_url,
    });

    const token = issueJWT(newUser);

    return res.status(201).json({
      status: true,
      message: "Registrasi dengan Google berhasil",
      is_profile_complete: false, // wa_number belum diisi
      token,
      data: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        avatar_url: newUser.avatar_url,
        wa_number: null,
      },
    });
  } catch (error) {
    console.error("Error googleAuthHandler:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

module.exports = googleAuthHandler;
