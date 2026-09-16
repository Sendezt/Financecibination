const express = require("express");
const router = express.Router();
const tambahRekening = require("../controllers/tambahRekening");

/**
 * @swagger
 * /api/tambahRekening:
 *   post:
 *     summary: Add New Account
 *     description: Create a new financial account under the authenticated user.
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Account/rekening name
 *                 example: BCA John
 *     responses:
 *       201:
 *         description: Account successfully added
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
 *                   example: Rekening berhasil ditambahkan
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                     account_name:
 *                       type: string
 *                       example: BCA John
 *                     saldo:
 *                       type: number
 *                       example: 0
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-09-15T12:00:00.000Z"
 *       400:
 *         description: Bad request (missing or empty account name)
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
 *                   example: Nama rekening wajib diisi
 *       401:
 *         description: Unauthorized (missing or invalid token)
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
 *                   example: User tidak terautentikasi
 *       500:
 *         description: Internal server error
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
 *                   example: Gagal menambahkan rekening
 *                 error:
 *                   type: string
 *                   example: Error details
 */
router.post("/", tambahRekening);

module.exports = router;
