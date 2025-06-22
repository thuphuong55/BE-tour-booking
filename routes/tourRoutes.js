const express = require("express");
const router = express.Router();
const tourController = require("../controllers/tourController");

router.get("/", tourController.getAll);
router.get("/:id", tourController.getById);
router.post("/", tourController.create);
router.put("/:id", tourController.update);
router.delete("/:id", tourController.delete);

// Route thêm: lấy 1 tour kèm các ngày khởi hành
router.get("/:id/departures", tourController.getTourWithDepartures);
// Route bổ sung: lấy tour + danhmuc
router.get("/:id/categories", tourController.getTourWithCategories);

// ✅ Route bổ sung: lấy tour + dịch vụ bao gồm
router.post("/:tourId/included-services/:serviceId", tourController.assignIncludedServiceToTour);
router.get("/:id/included-services", tourController.getTourWithIncludedServices);
module.exports = router;
