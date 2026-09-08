const express = require("express");
const router = express.Router();
const mutasiMingguanHandler = require("../controllers/mutasiHandler");
const recentTransactionHandler = require("../controllers/recentTransactionHandler");

/**
 * @swagger
 * /api/mutasi:
 *   get:
 *     summary: Get weekly mutation history
 *     description: Retrieve transaction history for the last 7 calendar days across all accounts owned by the user.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success retrieving mutations
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
 *                   example: Data mutasi 7 hari terakhir
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Finance record ID
 *                         example: "finance-uuid"
 *                       account_id:
 *                         type: string
 *                         description: Associated account ID
 *                         example: "account-uuid"
 *                       account_name:
 *                         type: string
 *                         description: Account name
 *                         example: "BCA"
 *                       amount:
 *                         type: number
 *                         description: Transaction amount
 *                         example: 150000
 *                       mutation_type:
 *                         type: string
 *                         enum: [masuk, keluar]
 *                         description: Direction of money flow
 *                         example: masuk
 *                       transaction_type:
 *                         type: string
 *                         description: Type of transaction
 *                         example: "income"
 *                       transfer_id:
 *                         type: string
 *                         nullable: true
 *                         description: Transfer ID if related to a transfer
 *                         example: null
 *                       note:
 *                         type: string
 *                         nullable: true
 *                         description: Optional transaction note
 *                         example: "Gaji Bulanan"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Transaction date (UTC)
 *                         example: "2026-08-24T10:00:00.000Z"
 *                       date_indonesia:
 *                         type: string
 *                         description: Transaction date in Asia/Jakarta timezone
 *                         example: "2026-08-24 17:00:00"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No accounts found
 *       500:
 *         description: Internal server error
 */
router.get("/", mutasiMingguanHandler);

/**
 * @swagger
 * /api/mutasi/recent-transaction:
 *   get:
 *     summary: Get 5 recent transactions
 *     description: Retrieve the 5 most recent transactions across all accounts owned by the authenticated user, sorted by newest first.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success retrieving recent transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Data 5 transaksi terbaru berhasil diambil"
 *                 data:
 *                   type: array
 *                   maxItems: 5
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Finance record ID
 *                         example: "finance-uuid"
 *                       account:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Account ID
 *                             example: "account-uuid"
 *                           name:
 *                             type: string
 *                             description: Account name
 *                             example: "BCA"
 *                       amount:
 *                         type: number
 *                         description: Transaction amount
 *                         example: 150000
 *                       mutation_type:
 *                         type: string
 *                         enum: [masuk, keluar]
 *                         description: Direction of money flow
 *                         example: masuk
 *                       transaction_type:
 *                         type: string
 *                         enum: [income, expense, transfer]
 *                         description: Type of transaction
 *                         example: "income"
 *                       transfer_id:
 *                         type: string
 *                         nullable: true
 *                         description: Transfer ID if related to a transfer
 *                         example: null
 *                       note:
 *                         type: string
 *                         nullable: true
 *                         description: Optional transaction note
 *                         example: "Gaji Bulanan"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Transaction date (UTC)
 *                         example: "2026-08-24T10:00:00.000Z"
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Number of transactions returned
 *                       example: 5
 *       401:
 *         description: Unauthorized - User not authenticated
 *       500:
 *         description: Internal server error
 */
router.get("/recent-transaction", recentTransactionHandler);

module.exports = router;

