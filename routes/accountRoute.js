const express = require("express");
const router = express.Router();
const getAccountsHandler = require("../models/getAccountsWithSaldoHandler");

/**
 * @swagger
 * /api/getAccount:
 *   get:
 *     summary: Retrieve list of accounts with their balances
 *     description: Fetches a list of all accounts owned by the authenticated user along with their updated balance.
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success retrieving accounts
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
 *                   example: Data rekening berhasil diambil
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
router.get("/", getAccountsHandler);

module.exports = router;
