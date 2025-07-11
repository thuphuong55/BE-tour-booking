const express = require("express");
const router = express.Router();
const provinceController = require("../controllers/provinceController");

router.get("/search-tours", provinceController.searchAvailableTours);

module.exports = router;
