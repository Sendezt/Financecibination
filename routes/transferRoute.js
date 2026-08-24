const express = require("express");
const router = express.Router();
const transfer = require("../models/transfer");
const riwayatTransfer = require("../models/riwayatTransfer");

/**
 * @swagger
 * /api/transfer:
 *   post:
 *     summary: Transfer balance between accounts
 *     description: Performs a balance transfer from one account to another for the authenticated user.
 *     tags: [Transfer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from_account_id
 *               - to_account_id
 *               - amount
 *             properties:
 *               from_account_id:
 *                 type: string
 *                 example: "source-account-uuid"
 *               to_account_id:
 *                 type: string
 *                 example: "target-account-uuid"
 *               amount:
 *                 type: number
 *                 example: 50000
 *               deskripsi:
 *                 type: string
 *                 example: "Bayar Utang"
 *     responses:
 *       200:
 *         description: Transfer successful
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
 *                   example: "Transfer berhasil dilakukan"
 *       400:
 *         description: Bad request or transfer failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Gagal melakukan transfer"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/", transfer);

/**
 * @swagger
 * /api/transfer/riwayat:
 *   get:
 *     summary: Get transfer history
 *     description: Retrieve balance transfer history for the last 4 weeks (28 days) for the authenticated user.
 *     tags: [Transfer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success retrieving transfer history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 10
 *                       user_id:
 *                         type: string
 *                         example: "user-uuid"
 *                       from_account_id:
 *                         type: string
 *                         example: "source-account-uuid"
 *                       to_account_id:
 *                         type: string
 *                         example: "target-account-uuid"
 *                       amount:
 *                         type: number
 *                         example: 50000
 *                       deskripsi:
 *                         type: string
 *                         example: "Bayar Utang"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-08-24T12:00:00.000Z"
 *                       from_account:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "BCA"
 *                       to_account:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Mandiri"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/riwayat", riwayatTransfer);

module.exports = router;
