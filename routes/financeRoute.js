const express = require("express");
const router = express.Router();
const pemasukanHandler = require("../models/tambahPemasukan");
const pengeluaranHandler = require("../models/tambahPengeluaran");
const totalPengeluaranHandler = require("../models/totalPengeluaran");
const totalPemasukanHandler = require("../models/totalPemasukan");

router.post("/pemasukan", pemasukanHandler);
router.post("/pengeluaran", pengeluaranHandler);
router.get("/total-pengeluaran", totalPengeluaranHandler);
router.get("/total-pemasukan", totalPemasukanHandler);

module.exports = router;
