const express = require("express");
const router = express.Router();
const cleanUpHandler = require("../models/cleanUp");

router.post("/", cleanUpHandler);

module.exports = router;
