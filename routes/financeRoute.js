const express = require("express");
const router = express.Router();
const pemasukanHandler = require("../controllers/tambahPemasukan");
const pengeluaranHandler = require("../controllers/tambahPengeluaran");
const totalPengeluaranBulananHandler = require("../controllers/totalPengeluaranBulanan");
const totalPemasukanBulananHandler = require("../controllers/totalPemasukanBulanan");
const TotalPemasukanMingguanHandler = require("../controllers/totalPemasukanMingguan");
const TotalPengeluaranMingguanHandler = require("../controllers/totalPengeluaranMingguan");
const autototalPemasukanMingguanHandler = require("../controllers/autototalPemasukanMingguan");
const autototalPengeluaranMingguanHandler = require("../controllers/autototalPengeluaranMingguan");
const autototalPemasukanBulananHandler = require("../controllers/autototalPemasukanBulanan");
const autototalPengeluaranBulananHandler = require("../controllers/autototalPengeluaranBulanan");
const autototalPemasukanHarianHandler = require("../controllers/autototalPemasukanHarian");
const autototalPengeluaranHarianHandler = require("../controllers/autototalPengeluaranHarian");
const totalTransaksiHandler = require("../controllers/jumlahMutasi");

/**
 * @swagger
 * /api/finance/pemasukan:
 *   post:
 *     summary: Add income transaction
 *     description: Record a new income entry into an account owned by the authenticated user.
 *     tags: [Finance]
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
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *                 description: Account name
 *                 example: BCA
 *               amount:
 *                 type: number
 *                 description: Income amount
 *                 example: 1000000
 *               note:
 *                 type: string
 *                 description: Note or description of the transaction
 *                 example: "Gaji Freelance"
 *               created_at:
 *                 type: string
 *                 format: date-time
 *                 description: Optional transaction date
 *                 example: "2026-08-24T10:00:00.000Z"
 *     responses:
 *       201:
 *         description: Income successfully added
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
 *                   example: Pemasukan berhasil ditambahkan
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Finance record ID
 *                       example: "finance-uuid"
 *                     account_id:
 *                       type: string
 *                       description: Associated account ID
 *                       example: "account-uuid"
 *                     amount:
 *                       type: number
 *                       description: Income amount
 *                       example: 1000000
 *                     mutation_type:
 *                       type: string
 *                       description: Direction of money flow
 *                       example: "masuk"
 *                     transaction_type:
 *                       type: string
 *                       description: Type of transaction
 *                       example: "income"
 *                     note:
 *                       type: string
 *                       nullable: true
 *                       description: Optional note for the transaction
 *                       example: "Gaji Freelance"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Transaction date
 *                       example: "2026-08-24T10:00:00.000Z"
 *       400:
 *         description: Bad request (missing fields)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Account not found or not owned by user
 *       500:
 *         description: Internal server error
 */
router.post("/pemasukan", pemasukanHandler);

/**
 * @swagger
 * /api/finance/pengeluaran:
 *   post:
 *     summary: Add expense transaction
 *     description: Record a new expense entry from an account owned by the authenticated user.
 *     tags: [Finance]
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
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *                 description: Account name
 *                 example: BCA
 *               amount:
 *                 type: number
 *                 description: Expense amount
 *                 example: 50000
 *               note:
 *                 type: string
 *                 description: Note or description of the transaction
 *                 example: "Makan Siang"
 *               created_at:
 *                 type: string
 *                 format: date-time
 *                 description: Optional transaction date
 *                 example: "2026-08-24T10:00:00.000Z"
 *     responses:
 *       201:
 *         description: Expense successfully added
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
 *                   example: Pengeluaran berhasil ditambahkan
 *                 data:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                       example: 50000
 *                     note:
 *                       type: string
 *                       example: "Makan Siang"
 *       400:
 *         description: Bad request (missing fields)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Account not found or not owned by user
 *       500:
 *         description: Internal server error
 */
router.post("/pengeluaran", pengeluaranHandler);

/**
 * @swagger
 * /api/finance/total-pengeluaran-bulanan:
 *   get:
 *     summary: Get monthly expense total
 *     description: Retrieve total expenses grouped by account for a specific month and year.
 *     tags: [Finance Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *         description: Month (e.g. "08" or "8")
 *         example: "08"
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: string
 *         description: Year (e.g. "2026")
 *         example: "2026"
 *     responses:
 *       200:
 *         description: Success retrieving data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 user_id:
 *                   type: string
 *                   example: "user-uuid"
 *                 bulan:
 *                   type: string
 *                   example: "08"
 *                 tahun:
 *                   type: string
 *                   example: "2026"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       account_id:
 *                         type: string
 *                         example: "account-uuid"
 *                       nama_rekening:
 *                         type: string
 *                         example: "BCA"
 *                       total_pengeluaran:
 *                         type: number
 *                         example: 150000
 *                 total_pengeluaran_user:
 *                   type: number
 *                   example: 150000
 *       400:
 *         description: Bad request (missing parameters)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/total-pengeluaran-bulanan", totalPengeluaranBulananHandler);

/**
 * @swagger
 * /api/finance/total-pemasukan-bulanan:
 *   get:
 *     summary: Get monthly income total
 *     description: Retrieve total income grouped by account for a specific month and year.
 *     tags: [Finance Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *         description: Month (e.g. "08" or "8")
 *         example: "08"
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: string
 *         description: Year (e.g. "2026")
 *         example: "2026"
 *     responses:
 *       200:
 *         description: Success retrieving data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 user_id:
 *                   type: string
 *                   example: "user-uuid"
 *                 bulan:
 *                   type: string
 *                   example: "08"
 *                 tahun:
 *                   type: string
 *                   example: "2026"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       account_id:
 *                         type: string
 *                         example: "account-uuid"
 *                       nama_rekening:
 *                         type: string
 *                         example: "BCA"
 *                       total_pemasukan:
 *                         type: number
 *                         example: 2000000
 *                 total_pemasukan_user:
 *                   type: number
 *                   example: 2000000
 *       400:
 *         description: Bad request (missing parameters)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/total-pemasukan-bulanan", totalPemasukanBulananHandler);

/**
 * @swagger
 * /api/finance/total-pemasukan-mingguan:
 *   get:
 *     summary: Get weekly income total (custom)
 *     description: Retrieve total income grouped by account for a specific month, year, and week.
 *     tags: [Finance Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *         description: Month
 *         example: "08"
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: string
 *         description: Year
 *         example: "2026"
 *       - in: query
 *         name: week
 *         required: true
 *         schema:
 *           type: string
 *         description: Week number (1-5)
 *         example: "1"
 *     responses:
 *       200:
 *         description: Success retrieving data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 user_id:
 *                   type: string
 *                 bulan:
 *                   type: string
 *                 tahun:
 *                   type: string
 *                 minggu:
 *                   type: string
 *                 rentang_tanggal:
 *                   type: object
 *                   properties:
 *                     start:
 *                       type: string
 *                     end:
 *                       type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total_pemasukan_user:
 *                   type: number
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/total-pemasukan-mingguan", TotalPemasukanMingguanHandler);

/**
 * @swagger
 * /api/finance/total-pengeluaran-mingguan:
 *   get:
 *     summary: Get weekly expense total (custom)
 *     description: Retrieve total expenses grouped by account for a specific month, year, and week.
 *     tags: [Finance Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *         example: "08"
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: string
 *         example: "2026"
 *       - in: query
 *         name: week
 *         required: true
 *         schema:
 *           type: string
 *         example: "1"
 *     responses:
 *       200:
 *         description: Success retrieving data
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/total-pengeluaran-mingguan", TotalPengeluaranMingguanHandler);

/**
 * @swagger
 * /api/finance/autototal-pemasukan-mingguan:
 *   get:
 *     summary: Get weekly income total automatically (current week)
 *     description: Retrieve total income grouped by account automatically based on current date.
 *     tags: [Finance Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success retrieving data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/autototal-pemasukan-mingguan", autototalPemasukanMingguanHandler);

/**
 * @swagger
 * /api/finance/autototal-pengeluaran-mingguan:
 *   get:
 *     summary: Get weekly expense total automatically (current week)
 *     description: Retrieve total expenses grouped by account automatically based on current date.
 *     tags: [Finance Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success retrieving data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/autototal-pengeluaran-mingguan",
  autototalPengeluaranMingguanHandler
);

/**
 * @swagger
 * /api/finance/autototal-pemasukan-bulanan:
 *   get:
 *     summary: Get monthly income total automatically (current month)
 *     description: Retrieve total income grouped by account automatically based on current date.
 *     tags: [Finance Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success retrieving data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/autototal-pemasukan-bulanan", autototalPemasukanBulananHandler);

/**
 * @swagger
 * /api/finance/autototal-pengeluaran-bulanan:
 *   get:
 *     summary: Get monthly expense total automatically (current month)
 *     description: Retrieve total expenses grouped by account automatically based on current date.
 *     tags: [Finance Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success retrieving data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/autototal-pengeluaran-bulanan",
  autototalPengeluaranBulananHandler
);

/**
 * @swagger
 * /api/finance/autototal-pemasukan-harian:
 *   get:
 *     summary: Get daily income total automatically (today)
 *     description: Retrieve total income grouped by account automatically based on current date.
 *     tags: [Finance Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success retrieving data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/autototal-pemasukan-harian", autototalPemasukanHarianHandler);

/**
 * @swagger
 * /api/finance/autototal-pengeluaran-harian:
 *   get:
 *     summary: Get daily expense total automatically (today)
 *     description: Retrieve total expenses grouped by account automatically based on current date.
 *     tags: [Finance Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success retrieving data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/autototal-pengeluaran-harian", autototalPengeluaranHarianHandler);

/**
 * @swagger
 * /api/finance/total-transaksi:
 *   get:
 *     summary: Get transaction totals summary for past 7 days
 *     description: Fetch daily incoming/outgoing transaction sums for the past week, along with overall weekly totals.
 *     tags: [Finance Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success retrieving totals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 user_id:
 *                   type: string
 *                 periode:
 *                   type: object
 *                   properties:
 *                     mulai:
 *                       type: string
 *                       example: "2026-08-18"
 *                     selesai:
 *                       type: string
 *                       example: "2026-08-24"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tanggal:
 *                         type: string
 *                         example: "2026-08-18"
 *                       total_pemasukan:
 *                         type: number
 *                         example: 500000
 *                       total_pengeluaran:
 *                         type: number
 *                         example: 200000
 *                 total_pemasukan:
 *                   type: number
 *                   example: 1200000
 *                 total_pengeluaran:
 *                   type: number
 *                   example: 800000
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/total-transaksi", totalTransaksiHandler);

module.exports = router;
