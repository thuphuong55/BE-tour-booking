const express = require("express");
const router = express.Router();
const adminTourController = require("../controllers/adminTourController");
const protect = require("../middlewares/protect");

// Middleware: chỉ admin mới được access
router.use(protect(["admin"]));

// 📋 Tour Management với Pagination
router.get("/", adminTourController.getAllTours);

// ➕ Tour Creation
router.post("/", adminTourController.createTour);

// 📊 Tour Statistics
router.get("/stats", adminTourController.getTourStats);

// ✅ Tour Approval Operations
router.patch("/:id/approve", adminTourController.approveTour);
router.patch("/:id/reject", adminTourController.rejectTour);

// 🔄 Tour Status Management
router.patch("/:id/status", adminTourController.updateTourStatus);

// ✏️ Tour Full Update
router.put("/:id", adminTourController.updateTour);

// 🗑️ Tour Deletion
router.delete("/:id", adminTourController.deleteTour);

// 🔄 Bulk Operations
router.patch("/bulk/status", adminTourController.bulkUpdateStatus);

module.exports = router;
