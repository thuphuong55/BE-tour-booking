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
// Route bổ sung: lấy tour + danh mục
router.get("/:id/categories", tourController.getTourWithCategories);
// Route bổ sung: lấy tour + dịch vụ bao gồm
router.get("/:id/included-services", tourController.getTourWithIncludedServices);
// Route bổ sung: lấy tour + khách sạn
router.get("/:id/hotels", tourController.getTourWithHotels);
// Route bổ sung: lấy tour + dịch vụ loại trừ
router.get("/:id/excluded-services", tourController.getTourWithExcludedServices);
// Route bổ sung: lấy tour + hành trình
router.get("/:id/itineraries", tourController.getTourWithItineraries);
// Route bổ sung: lấy tour với tất cả thông tin liên quan
router.get("/:id/complete", tourController.getTourComplete);

// Routes gán dịch vụ/khách sạn cho tour
router.post("/:tourId/included-services/:serviceId", tourController.assignIncludedServiceToTour);
router.post("/:tourId/excluded-services/:serviceId", tourController.assignExcludedServiceToTour);
router.post("/:tourId/hotels/:hotelId", tourController.assignHotelToTour);

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
