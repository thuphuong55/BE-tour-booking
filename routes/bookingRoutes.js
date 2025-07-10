const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const momoController = require("../controllers/momoController");

router.get("/", bookingController.getAll);
router.get("/:id", bookingController.getById);
router.post("/", bookingController.create);
router.put("/:id", bookingController.update);
router.delete("/:id", bookingController.delete);



module.exports = router;
