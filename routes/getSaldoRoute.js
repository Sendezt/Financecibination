const express = require("express");
const router = express.Router();
const getSaldo = require("../models/getSaldoHandler");

router.get("/", getSaldo);

module.exports = router;
