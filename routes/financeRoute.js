const express = require("express");
const router = express.Router();
const pemasukanHandler = require("../models/tambahPemasukan");
const pengeluaranHandler = require("../models/tambahPengeluaran");
const totalPengeluaranBulananHandler = require("../models/totalPengeluaranBulanan");
const totalPemasukanBulananHandler = require("../models/totalPemasukanBulanan");
const TotalPemasukanMingguanHandler = require("../models/totalPemasukanMingguan");
const TotalPengeluaranMingguanHandler = require("../models/totalPengeluaranMingguan");

router.post("/pemasukan", pemasukanHandler);
router.post("/pengeluaran", pengeluaranHandler);
router.get("/total-pengeluaran-bulanan", totalPengeluaranBulananHandler);
router.get("/total-pemasukan-bulanan", totalPemasukanBulananHandler);
router.get("/total-pemasukan-mingguan", TotalPemasukanMingguanHandler);
router.get("/total-pengeluaran-mingguan", TotalPengeluaranMingguanHandler);

module.exports = router;
