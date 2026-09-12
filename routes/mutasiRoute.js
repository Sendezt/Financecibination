const express = require("express");
const router = express.Router();
const mutasiHandler = require("../controllers/mutasiHandler");
const recentTransactionHandler = require("../controllers/recentTransactionHandler");
const chartAktivitasKeuanganHandler = require("../controllers/chartController/chartAktivitasKeuanganHandler");
const mutasiSummaryHandler = require("../controllers/mutasiSummaryHandler");

/**
 * @swagger
 * /api/mutasi:
 *   get:
 *     summary: Get mutation history with date range and pagination
 *     description: >
 *       Retrieve transaction history across all accounts owned by the user.
 *       Supports selectable date ranges (7 days, 1 month, 3 months) and pagination.
 *       Utilizes composite index idx_finance_account_created_at (account_id, created_at) for optimal query performance.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [7d, 1m, 3m]
 *           default: 7d
 *         description: "Date range filter: 7d = 7 days, 1m = 1 month, 3m = 3 months"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 15
 *         description: Number of items per page (max 100)
 *     responses:
 *       200:
 *         description: Success retrieving mutations
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
 *                   example: "Data mutasi 7 hari terakhir berhasil diambil"
 *                 data:
 *                   type: array
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
 *                     period:
 *                       type: object
 *                       properties:
 *                         range:
 *                           type: string
 *                           example: "7d"
 *                         from:
 *                           type: string
 *                           format: date-time
 *                         to:
 *                           type: string
 *                           format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 15
 *                         total_items:
 *                           type: integer
 *                           example: 42
 *                         total_pages:
 *                           type: integer
 *                           example: 3
 *                         has_previous:
 *                           type: boolean
 *                           example: false
 *                         has_next:
 *                           type: boolean
 *                           example: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", mutasiHandler);

/**
 * @swagger
 * /api/mutasi/summary:
 *   get:
 *     summary: Get mutation summary for dashboard cards
 *     description: >
 *       Returns aggregated totals for the three summary cards:
 *       Total Pemasukan (income sum + count), Total Pengeluaran (expense sum + count),
 *       and Net Mutasi Periode (net cashflow + surplus/defisit status).
 *       Uses the same configurable date range as the main mutation endpoint.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [7d, 1m, 3m]
 *           default: 7d
 *         description: "Date range filter: 7d = 7 days, 1m = 1 month, 3m = 3 months"
 *     responses:
 *       200:
 *         description: Success retrieving mutation summary
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
 *                   example: "Ringkasan mutasi 7 hari terakhir berhasil diambil"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_pemasukan:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           description: Total income amount in the period
 *                           example: 2400000
 *                         count:
 *                           type: integer
 *                           description: Number of income mutations
 *                           example: 4
 *                     total_pengeluaran:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           description: Total expense amount in the period
 *                           example: 1450000
 *                         count:
 *                           type: integer
 *                           description: Number of expense mutations
 *                           example: 2
 *                     net_mutasi:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           description: Net cashflow (income - expense)
 *                           example: 950000
 *                         status:
 *                           type: string
 *                           enum: [surplus, defisit, netral]
 *                           description: Net cashflow status
 *                           example: surplus
 *                 meta:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         range:
 *                           type: string
 *                           example: "7d"
 *                         from:
 *                           type: string
 *                           format: date-time
 *                         to:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/summary", mutasiSummaryHandler);

/**
 * @swagger
 * /api/mutasi/chart-aktivitas:
 *   get:
 *     summary: Get 7-day income vs expense data for line chart
 *     description: >
 *       Retrieve daily aggregated income and expense totals for the last 7 days.
 *       Data is sourced from the pre-aggregated daily_finance_summary table.
 *       Returns all 7 days with zero-filled values for days without transactions.
 *       Designed for the "Aktivitas Keuangan" line chart with two lines (Pemasukan & Pengeluaran).
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success retrieving chart data
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
 *                   example: "Data aktivitas keuangan 7 hari terakhir berhasil diambil"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         description: Date in YYYY-MM-DD format
 *                         example: "2026-09-06"
 *                       label:
 *                         type: string
 *                         description: Short label for chart axis (month/day)
 *                         example: "9/6"
 *                       income:
 *                         type: number
 *                         description: Total income for the day
 *                         example: 1050000
 *                       expense:
 *                         type: number
 *                         description: Total expense for the day
 *                         example: 550000
 *                 meta:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         from:
 *                           type: string
 *                           format: date
 *                           example: "2026-09-06"
 *                         to:
 *                           type: string
 *                           format: date
 *                           example: "2026-09-12"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_income:
 *                           type: number
 *                           example: 2100000
 *                         total_expense:
 *                           type: number
 *                           example: 800000
 *                         net:
 *                           type: number
 *                           description: "total_income - total_expense"
 *                           example: 1300000
 *       401:
 *         description: Unauthorized - User not authenticated
 *       500:
 *         description: Internal server error
 */
router.get("/chart-aktivitas", chartAktivitasKeuanganHandler);

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

