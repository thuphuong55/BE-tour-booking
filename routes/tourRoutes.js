const express = require("express");
const router = express.Router();
const tourController = require("../controllers/tourController");
const protect = require("../middlewares/protect");
const ensureAgencyApproved = require("../middlewares/ensureAgencyApproved");

// Endpoint lấy tour theo location qua itinerary
router.get("/location/:locationId", tourController.getToursByLocation);

// Lấy danh sách tour theo destination
router.get("/destination/:destinationId", tourController.getToursByDestination);

// Thêm route test-log
router.get("/test-log", (req, res) => {
  console.log("Test route /test-log đã nhận request!");
  res.json({ message: "Test route OK" });
});

router.get("/", tourController.getAll);

// Lấy tours của agency hiện tại (cần authentication)
router.get("/my-agency", protect(["agency"]), async (req, res) => {
  try {
    const { Tour, DepartureDate, TourImage, Promotion, Agency } = require("../models");
    
    // Kiểm tra authentication
    if (!req.user) {
      return res.status(401).json({ message: "Cần đăng nhập để truy cập" });
    }
    
    // Kiểm tra role agency
    if (req.user.role !== 'agency') {
      return res.status(403).json({ message: "Chỉ agency mới có thể truy cập endpoint này" });
    }
    
    console.log("User from token:", req.user); // Debug log
    
    // Tìm agency_id từ user_id
    const agency = await Agency.findOne({
      where: { user_id: req.user.id }
    });
    
    if (!agency) {
      return res.status(404).json({ message: "Không tìm thấy agency cho user này" });
    }
    
    console.log("Found agency:", agency.id); // Debug log
    
    const tours = await Tour.findAll({
      where: { agency_id: agency.id },
      include: [
        {
          model: DepartureDate,
          as: 'departureDates',
          attributes: [
            ['id', 'departureDates_id'],
            'departure_date',
            'end_date',
            'number_of_days',
            'number_of_nights'
          ]
        },
        {
          model: TourImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main']
        },
        {
          model: Promotion,
          as: 'promotion',
          attributes: ['id', 'code', 'description', 'discount_amount'],
          required: false
        }
      ],
      order: [["created_at", "DESC"]]
    });
    
    console.log("Found tours for agency:", tours.length); // Debug log
    
    res.json(tours);
  } catch (error) {
    console.error("Error fetching agency tours:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// Lấy tours có promotion đang hoạt động
router.get("/with-promotions", async (req, res) => {
  try {
    const { Tour, Promotion } = require("../models");
    const { Op } = require("sequelize");
    
    const now = new Date();
    const toursWithPromotions = await Tour.findAll({
      include: [
        {
          model: Promotion,
          as: "promotion",
          where: {
            start_date: { [Op.lte]: now },
            end_date: { [Op.gte]: now }
          },
          required: true // INNER JOIN - chỉ lấy tour có promotion
        }
      ],
      where: { status: 'Đang hoạt động' },
      order: [["created_at", "DESC"]]
    });
    
    res.json(toursWithPromotions);
  } catch (error) {
    console.error("Error fetching tours with promotions:", error);
    res.status(500).json({ error: "Lỗi khi lấy tours có promotion", details: error.message });
  }
});

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

// Route alias cho getCompleteTour
router.get("/:tourId/complete", tourController.getCompleteTour);

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
