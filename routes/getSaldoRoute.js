const express = require("express");
const router = express.Router();
const getSaldo = require("../controllers/getSaldoHandler");

/**
 * @swagger
 * /api/getSaldo:
 *   get:
 *     summary: Get balance by user
 *     description: Retrieve total incoming, total outgoing, and current balances for all accounts owned by the user.
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success retrieving balance details
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
 *                   example: Data saldo berhasil diambil
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       account_id:
 *                         type: string
 *                         example: "account-uuid"
 *                       account_name:
 *                         type: string
 *                         example: "BCA"
 *                       total_masuk:
 *                         type: number
 *                         example: 500000
 *                       total_keluar:
 *                         type: number
 *                         example: 200000
 *                       saldo:
 *                         type: number
 *                         example: 300000
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No accounts found
 *       500:
 *         description: Internal server error
 */
router.get("/", getSaldo);

module.exports = router;
