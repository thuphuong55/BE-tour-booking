const express = require("express");
const router = express.Router();
const tourController = require("../controllers/tourController");
const protect = require("../middlewares/protect");
const ensureAgencyApproved = require("../middlewares/ensureAgencyApproved");



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

router.post(
  "/",
  protect(["agency"]),
  ensureAgencyApproved,
  tourController.create
);

router.put(
  "/:id",
  protect(["agency"]),
  ensureAgencyApproved,
  tourController.update
);

router.delete(
  "/:id",
  protect(["agency"]),
  ensureAgencyApproved,
  tourController.delete
);

router.post(
  "/:tourId/included-services/:serviceId",
  protect(["agency"]),
  ensureAgencyApproved,
  tourController.assignIncludedServiceToTour
);
module.exports = router;
