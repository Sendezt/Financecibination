const express = require("express");
const router = express.Router();
const mutasiMingguanHandler = require("../models/mutasiHandler");

router.get("/", mutasiMingguanHandler);

module.exports = router;
