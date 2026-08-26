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
 *                     account_name:
 *                       type: string
 *                       example: BCA John
 *       400:
 *         description: Bad request (missing user ID or account name)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User ID dan Nama rekening wajib diisi.
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/", tambahRekening);

module.exports = router;
