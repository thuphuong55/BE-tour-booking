const express = require("express");
const router = express.Router();
const controller = require("../controllers/provinceController");

router.get("/search", controller.searchProvinces);

module.exports = router;
