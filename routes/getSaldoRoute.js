const express = require("express");
const router = express.Router();
const getSaldo = require("../controllers/getSaldoHandler");

/**
 * @swagger
 * /api/getSaldo:
 *   get:
 *     summary: Get balance by user
 *     description: Retrieve current balances for all accounts owned by the authenticated user.
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
 *                         description: Account ID
 *                         example: "account-uuid"
 *                       account_name:
 *                         type: string
 *                         description: Account name
 *                         example: "BCA"
 *                       saldo:
 *                         type: number
 *                         description: Current account balance
 *                         example: 1500000
 *                       last_updated:
 *                         type: string
 *                         format: date-time
 *                         description: Last time the account was updated
 *                         example: "2026-08-27T10:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No accounts found
 *       500:
 *         description: Internal server error
 */
router.get("/", getSaldo);

module.exports = router;
