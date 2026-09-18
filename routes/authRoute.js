const express = require("express");
const router = express.Router();
const loginHandler = require("../controllers/authController/loginHandler");
const registerHandler = require("../controllers/authController/registerHandler");
const googleAuthHandler = require("../controllers/authController/googleAuthHandler");
const completeProfileHandler = require("../controllers/authController/completeProfileHandler");
const meHandler = require("../controllers/authController/meHandler");
const logoutHandler = require("../controllers/authController/logoutHandler");
const verifyToken = require("../middleware/verifyToken");

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User Login
 *     description: Authenticate user with email and password to receive a JWT token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@testing1.com
 *               password:
 *                 type: string
 *                 example: user@testing1.com
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/login", loginHandler);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User Registration
 *     description: Register a new user with full name, email, password, and WhatsApp number.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - password
 *               - wa_number
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: secretpassword
 *               wa_number:
 *                 type: string
 *                 example: "081234567890"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user-uuid"
 *                     full_name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     wa_number:
 *                       type: string
 *                       example: "081234567890"
 *       400:
 *         description: Bad Request (e.g. Email already registered)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email sudah terdaftar
 *       500:
 *         description: Internal server error
 */
router.post("/register", registerHandler);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Login atau Register menggunakan Google OAuth
 *     description: >
 *       Memverifikasi id_token dari Google Sign-In di sisi frontend.
 *       Terdapat 3 skenario otomatis:
 *       1. **Login** — jika google_id sudah terdaftar, langsung login.
 *       2. **Account Linking** — jika email sudah ada (dari register biasa), tautkan google_id ke akun tersebut lalu login.
 *       3. **Auto-Register** — jika email belum ada, buat akun baru dan login.
 *
 *       Jika `is_profile_complete: false` pada response, frontend wajib mengarahkan
 *       pengguna ke halaman pengisian `wa_number` sebelum mengakses fitur utama.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_token
 *             properties:
 *               id_token:
 *                 type: string
 *                 description: id_token yang didapat dari Google Sign-In di sisi frontend (Google Identity Services)
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
 *     responses:
 *       200:
 *         description: Login atau account linking berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login dengan Google berhasil"
 *                 is_profile_complete:
 *                   type: boolean
 *                   description: >
 *                     false jika wa_number belum diisi. Frontend harus redirect ke
 *                     halaman complete-profile sebelum mengakses fitur utama.
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT Bearer token valid 7 hari
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user-uuid"
 *                     full_name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john@gmail.com"
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     avatar_url:
 *                       type: string
 *                       nullable: true
 *                       example: "https://lh3.googleusercontent.com/a/..."
 *                     wa_number:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *       201:
 *         description: Auto-register akun baru berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Registrasi dengan Google berhasil"
 *                 is_profile_complete:
 *                   type: boolean
 *                   example: false
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 data:
 *                   type: object
 *       400:
 *         description: id_token tidak dikirimkan
 *       401:
 *         description: id_token tidak valid atau email Google belum diverifikasi
 *       500:
 *         description: Internal server error
 */
router.post("/google", googleAuthHandler);

/**
 * @swagger
 * /api/auth/complete-profile:
 *   put:
 *     summary: Lengkapi profil pengguna setelah OAuth Google
 *     description: >
 *       Digunakan oleh pengguna yang register via Google dan belum mengisi wa_number.
 *       Endpoint ini terproteksi JWT. Jika `is_profile_complete: false` diterima dari
 *       `/api/auth/google`, frontend wajib memanggil endpoint ini sebelum pengguna
 *       dapat mengakses fitur utama aplikasi.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wa_number
 *             properties:
 *               wa_number:
 *                 type: string
 *                 description: Nomor WhatsApp pengguna (unik)
 *                 example: "081234567890"
 *               full_name:
 *                 type: string
 *                 description: Opsional — update nama jika diperlukan
 *                 example: "John Doe"
 *     responses:
 *       200:
 *         description: Profil berhasil dilengkapi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profil berhasil dilengkapi"
 *                 is_profile_complete:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user-uuid"
 *                     full_name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john@gmail.com"
 *                     wa_number:
 *                       type: string
 *                       example: "081234567890"
 *                     avatar_url:
 *                       type: string
 *                       nullable: true
 *                       example: "https://lh3.googleusercontent.com/a/..."
 *       400:
 *         description: wa_number tidak dikirim atau sudah dipakai akun lain
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put("/complete-profile", verifyToken, completeProfileHandler);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Cek status autentikasi dan data user yang sedang login
 *     description: >
 *       Membaca JWT dari HttpOnly cookie (bukan Authorization header).
 *       Digunakan oleh frontend untuk mengecek apakah user sudah authenticated
 *       dan mengambil data user (full_name, wa_number, email) tanpa perlu
 *       membaca cookie secara langsung via JavaScript.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User sudah authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     full_name:
 *                       type: string
 *                       example: John Doe
 *                     wa_number:
 *                       type: string
 *                       example: "08123456789"
 *                     email:
 *                       type: string
 *                       example: john@example.com
 *                     role:
 *                       type: string
 *                       example: user
 *                     avatar_url:
 *                       type: string
 *                       nullable: true
 *       401:
 *         description: Tidak authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
router.get("/me", verifyToken, meHandler);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout — hapus HttpOnly cookie token
 *     description: Menghapus cookie token sehingga user tidak lagi authenticated.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 */
router.post("/logout", logoutHandler);

module.exports = router;
