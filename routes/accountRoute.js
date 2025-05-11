const express = require("express");
const router = express.Router();
const getAccountsHandler = require("../models/getAccountsWithSaldoHandler");

router.get("/", getAccountsHandler);

module.exports = router;
