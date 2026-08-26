const express = require("express");
const router = express.Router();
const cleanUpHandler = require("../controllers/cleanUpHandler");

/**
 * @swagger
 * /api/cleanUp:
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
router.get("/", cleanUpHandler);

module.exports = router;
