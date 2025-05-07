const express = require("express");
const router = express.Router();
const tambahRekening = require("../models/tambahRekening");

router.post("/", tambahRekening);

module.exports = router;
