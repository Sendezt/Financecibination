const express = require("express");
const router = express.Router();
const mutasiMingguanHandler = require("../models/mutasiHandler");

/**
 * @swagger
 * /api/mutasi:
 *   get:
 *     summary: Get weekly mutation history
 *     description: Retrieve transaction history for the last 7 days across all accounts owned by the user.
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
 *                   example: Data mutasi 1 minggu terakhir
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 101
 *                       account_id:
 *                         type: string
 *                         example: "account-uuid"
 *                       amount:
 *                         type: number
 *                         example: 150000
 *                       mutation_type:
 *                         type: string
 *                         enum: [masuk, keluar]
 *                         example: masuk
 *                       note:
 *                         type: string
 *                         example: "Gaji Bulanan"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-08-24T10:00:00.000Z"
 *                       account_name:
 *                         type: string
 *                         example: "BCA"
 *                       date_indonesia:
 *                         type: string
 *                         example: "2026-08-24 17:00:00"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No accounts found
 *       500:
 *         description: Internal server error
 */
router.get("/", mutasiMingguanHandler);

module.exports = router;
