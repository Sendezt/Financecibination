const express = require("express");
const router = express.Router();
const transfer = require("../models/transfer");
const riwayatTransfer = require("../models/riwayatTransfer");

router.post("/", transfer);
router.get("/riwayat", riwayatTransfer);

module.exports = router;
