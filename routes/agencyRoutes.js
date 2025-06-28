const express = require("express");
const router = express.Router();
const agencyController = require("../controllers/agencyController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/request-agency", protect(["user"]), agencyController.requestAgency);
router.put("/:id/approve", protect(["admin"]), agencyController.approvedAgency);
router.get("/", protect(["admin"]), agencyController.getAllAgencies);
module.exports = router;
