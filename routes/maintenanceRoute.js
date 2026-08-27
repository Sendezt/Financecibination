const express = require("express");
const router = express.Router();
const cleanUpHandler = require("../controllers/maintenanceContoller/cleanUpHandler");
const generateDailySummaryHandler = require("../controllers/maintenanceContoller/generateDailySummaryHandler");

/**
 * @swagger
 * /api/maintenance/cleanup:
 *   get:
 *     summary: Clean up old transaction records
 *     description: Automatically delete transaction records (finance mutations) older than 1 year.
 *     tags: [Maintenance]
 *     responses:
 *       200:
 *         description: Success cleaning up old records
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
 *                   example: Data yang lebih dari 1 tahun berhasil dihapus
 *                 deleted_rows:
 *                   type: integer
 *                   example: 5
 *       500:
 *         description: Internal server error
 */
router.get("/cleanup", cleanUpHandler);

/**
 * @swagger
 * /api/maintenance/generate-daily-summary:
 *   get:
 *     summary: Generate daily finance summary
 *     description: Generate a daily finance summary for all users based on yesterday's transactions (income & expense). If a summary already exists for the date, it will be updated (upsert).
 *     tags: [Maintenance]
 *     responses:
 *       200:
 *         description: Daily finance summary generated successfully
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
 *                   example: Daily finance summary berhasil dibuat
 *                 date:
 *                   type: string
 *                   format: date
 *                   example: "2026-08-26"
 *                 total_users:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         example: "uuid-user-id"
 *                       total_income:
 *                         type: number
 *                         example: 500000
 *                       total_expense:
 *                         type: number
 *                         example: 200000
 *                       total_transaction:
 *                         type: integer
 *                         example: 10
 *                       created:
 *                         type: boolean
 *                         example: true
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
 *                   example: Gagal membuat daily finance summary
 */
router.get("/generate-daily-summary", generateDailySummaryHandler);

module.exports = router;
