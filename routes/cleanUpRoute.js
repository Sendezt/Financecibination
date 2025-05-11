const express = require("express");
const router = express.Router();
const cleanUpHandler = require("../models/cleanUpHandler");

router.get("/", cleanUpHandler);

module.exports = router;
