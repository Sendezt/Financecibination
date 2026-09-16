const express = require("express");
const router = express.Router();
const mutasiHandler = require("../controllers/mutasiHandler");
const recentTransactionHandler = require("../controllers/recentTransactionHandler");
const chartAktivitasKeuanganHandler = require("../controllers/chartController/chartAktivitasKeuanganHandler");
const mutasiSummaryHandler = require("../controllers/mutasiSummaryHandler");
const mutasiByAccountHandler = require("../controllers/mutasiByAccountHandler");
const chartTrenSaldoAccountHandler = require("../controllers/chartController/chartTrenSaldoAccountHandler");
const updateSaldoHandler = require("../controllers/updateSaldoHandler");

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

/**
 * @swagger
 * /api/mutasi/account/{accountId}:
 *   get:
 *     summary: Get mutation history for a specific account
 *     description: >
 *       Retrieve transaction mutation history for a specific account owned by the authenticated user.
 *       Includes account details, income/expense summary, selectable date range (7d, 1m, 3m, all), optional transaction filters, and pagination.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Account ID (UUID)
 *         example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [7d, 1m, 3m, all]
 *           default: 7d
 *         description: "Date range filter: 7d = 7 days, 1m = 1 month, 3m = 3 months, all = all time"
 *       - in: query
 *         name: mutation_type
 *         schema:
 *           type: string
 *           enum: [masuk, keluar]
 *         description: "Filter by flow direction: masuk (incoming) or keluar (outgoing)"
 *       - in: query
 *         name: transaction_type
 *         schema:
 *           type: string
 *           enum: [income, expense, transfer]
 *         description: "Filter by transaction category: income, expense, or transfer"
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
 *         description: Success retrieving account mutations
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
 *                   example: "Data mutasi rekening BCA (7 hari terakhir) berhasil diambil"
 *                 account:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                     name:
 *                       type: string
 *                       example: "BCA"
 *                     saldo:
 *                       type: number
 *                       example: 2500000
 *                     last_updated:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-09-15T10:00:00.000Z"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-08-01T00:00:00.000Z"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_pemasukan:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           example: 1000000
 *                         count:
 *                           type: integer
 *                           example: 2
 *                     total_pengeluaran:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           example: 350000
 *                         count:
 *                           type: integer
 *                           example: 1
 *                     net_mutasi:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           example: 650000
 *                         status:
 *                           type: string
 *                           enum: [surplus, defisit, netral]
 *                           example: "surplus"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "finance-uuid"
 *                       account:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "account-uuid"
 *                           name:
 *                             type: string
 *                             example: "BCA"
 *                       amount:
 *                         type: number
 *                         example: 150000
 *                       mutation_type:
 *                         type: string
 *                         enum: [masuk, keluar]
 *                         example: "masuk"
 *                       transaction_type:
 *                         type: string
 *                         enum: [income, expense, transfer]
 *                         example: "income"
 *                       transfer_id:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       note:
 *                         type: string
 *                         nullable: true
 *                         example: "Gaji Bulanan"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-09-15T10:00:00.000Z"
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
 *                           example: 25
 *                         total_pages:
 *                           type: integer
 *                           example: 2
 *                         has_previous:
 *                           type: boolean
 *                           example: false
 *                         has_next:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Bad request (missing or invalid account ID)
 *       401:
 *         description: Unauthorized - User not authenticated
 *       404:
 *         description: Account not found or not owned by the user
 *       500:
 *         description: Internal server error
 */
router.get("/account/:accountId", mutasiByAccountHandler);
router.get("/account/:id", mutasiByAccountHandler);

/**
 * @swagger
 * /api/mutasi/chart-tren-saldo/{accountId}:
 *   get:
 *     summary: Get balance trend chart data and stats for an account
 *     description: >
 *       Retrieve daily balance progression, transaction volume (masuk & keluar), minimum/maximum balance,
 *       and growth percentage for the "Tren Saldo" chart of a specific account.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Account ID (UUID)
 *         example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [7d, 30d, month]
 *           default: 30d
 *         description: "Date filter: 7d (7 Hari), 30d (30 Hari), month (Bulan Ini)"
 *     responses:
 *       200:
 *         description: Success retrieving balance trend chart data
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
 *                   example: "Data tren saldo rekening BCA (30 hari) berhasil diambil"
 *                 account:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                     name:
 *                       type: string
 *                       example: "BCA"
 *                     current_saldo:
 *                       type: number
 *                       example: 3800000
 *                 stats:
 *                   type: object
 *                   properties:
 *                     min_saldo:
 *                       type: number
 *                       example: 2800000
 *                     formatted_min_saldo:
 *                       type: string
 *                       example: "Rp 2.800.000"
 *                     max_saldo:
 *                       type: number
 *                       example: 3800000
 *                     formatted_max_saldo:
 *                       type: string
 *                       example: "Rp 3.800.000"
 *                     start_saldo:
 *                       type: number
 *                       example: 2800000
 *                     end_saldo:
 *                       type: number
 *                       example: 3800000
 *                     growth_amount:
 *                       type: number
 *                       example: 1000000
 *                     formatted_growth_amount:
 *                       type: string
 *                       example: "+Rp 1.000.000"
 *                     growth_percentage:
 *                       type: number
 *                       example: 35.71
 *                     status:
 *                       type: string
 *                       enum: [tumbuh, turun, stabil]
 *                       example: "tumbuh"
 *                     growth_label:
 *                       type: string
 *                       example: "Tumbuh +35.7% dalam 30 hari"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         example: "2026-09-06"
 *                       label:
 *                         type: string
 *                         example: "06 Sep"
 *                       saldo:
 *                         type: number
 *                         example: 3800000
 *                       masuk:
 *                         type: number
 *                         example: 1000000
 *                       keluar:
 *                         type: number
 *                         example: 0
 *                       net:
 *                         type: number
 *                         example: 1000000
 *                 meta:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         range:
 *                           type: string
 *                           example: "30d"
 *                         label:
 *                           type: string
 *                           example: "30 hari"
 *                         from:
 *                           type: string
 *                           example: "2026-08-17"
 *                         to:
 *                           type: string
 *                           example: "2026-09-15"
 *                         total_days:
 *                           type: integer
 *                           example: 30
 *       400:
 *         description: Bad request (missing account ID)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Account not found
 *       500:
 *         description: Internal server error
 */
router.get("/chart-tren-saldo/:accountId", chartTrenSaldoAccountHandler);
router.get("/chart-tren-saldo/:id", chartTrenSaldoAccountHandler);
router.get("/account/:accountId/chart-tren-saldo", chartTrenSaldoAccountHandler);
router.get("/account/:accountId/chart", chartTrenSaldoAccountHandler);

/**
 * @swagger
 * /api/mutasi/update-saldo:
 *   post:
 *     summary: Update account balance and auto-record mutation
 *     description: >
 *       Update the balance of a specific account to a new specified amount.
 *       Automatically calculates the difference between the new balance and the current balance:
 *       - If the new balance is greater than the current balance, records a mutation with mutation_type "masuk" and transaction_type "income".
 *       - If the new balance is less than the current balance, records a mutation with mutation_type "keluar" and transaction_type "expense".
 *       - Note is optional.
 *     tags: [Mutasi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - saldo
 *             properties:
 *               account_id:
 *                 type: string
 *                 format: uuid
 *                 description: Account ID (provide either account_id or name)
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               name:
 *                 type: string
 *                 description: Account name (provide either account_id or name)
 *                 example: "BCA"
 *               saldo:
 *                 type: number
 *                 description: The latest new balance
 *                 example: 5000000
 *               note:
 *                 type: string
 *                 nullable: true
 *                 description: Optional note for the mutation
 *                 example: "Penyesuaian saldo akhir bulan"
 *               created_at:
 *                 type: string
 *                 format: date-time
 *                 description: Optional transaction date
 *                 example: "2026-09-16T10:00:00.000Z"
 *     responses:
 *       200:
 *         description: Balance updated and mutation recorded successfully
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
 *                   example: "Saldo berhasil diperbarui. Tercatat mutasi masuk (income)."
 *                 data:
 *                   type: object
 *                   properties:
 *                     account:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                         name:
 *                           type: string
 *                           example: "BCA"
 *                         previous_saldo:
 *                           type: number
 *                           example: 4500000
 *                         current_saldo:
 *                           type: number
 *                           example: 5000000
 *                     mutation:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "finance-uuid"
 *                         amount:
 *                           type: number
 *                           example: 500000
 *                         mutation_type:
 *                           type: string
 *                           enum: [masuk, keluar]
 *                           example: "masuk"
 *                         transaction_type:
 *                           type: string
 *                           enum: [income, expense]
 *                           example: "income"
 *                         note:
 *                           type: string
 *                           nullable: true
 *                           example: "Penyesuaian saldo akhir bulan"
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-09-16T10:00:00.000Z"
 *       400:
 *         description: Bad request (validation error or balance unchanged)
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
 *                   example: "Saldo terbaru sama dengan saldo saat ini. Tidak ada perubahan saldo."
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Account not found
 *       500:
 *         description: Internal server error
 */
router.post("/update-saldo", updateSaldoHandler);
router.post("/updateSaldo", updateSaldoHandler);

module.exports = router;

