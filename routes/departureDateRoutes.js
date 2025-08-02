const express = require("express");
const router = express.Router();
const controller = require("../controllers/departureDateController");
const { protect } = require("../middlewares/auth");

// Debug: Check if protect is properly imported
console.log(`🔧 [DEBUG] protect middleware type:`, typeof protect);
console.log(`🔧 [DEBUG] protect middleware:`, protect ? 'defined' : 'undefined');

// Router-level logging
router.use((req, res, next) => {
  console.log(`📍 [ROUTER] Received ${req.method} ${req.originalUrl}`);
  console.log(`📍 [ROUTER] URL path: ${req.url}`);
  next();
});

// CRUD mặc định với phân quyền
router.get("/", (req, res, next) => {
  console.log(`📍 [ROUTE] GET / handler called`);
  next();
}, controller.getAllDepartureDates);            // GET /api/departure-dates?tour_id=...

router.get("/:id", (req, res, next) => {
  console.log(`📍 [ROUTE] GET /:id handler called with id=${req.params.id}`);
  console.log(`📍 [ROUTE] About to call next() to controller...`);
  try {
    next();
    console.log(`📍 [ROUTE] next() called successfully for getById`);
  } catch (error) {
    console.error(`📍 [ROUTE] Error calling next() for getById:`, error);
  }
}, controller.getById);        // GET /api/departure-dates/:id

router.get("/:id/bookings", (req, res, next) => {
  console.log(`📍 [ROUTE] GET /:id/bookings handler called with id=${req.params.id}`);
  console.log(`📍 [ROUTE] About to call next() to auth middleware...`);
  try {
    next();
    console.log(`📍 [ROUTE] next() called successfully for bookings`);
  } catch (error) {
    console.error(`📍 [ROUTE] Error calling next() for bookings:`, error);
  }
}, protect(), controller.getBookingsByDepartureDate); // GET /api/departure-dates/:id/bookings

router.post("/", 
  (req, res, next) => {
    console.log(`📍 [ROUTE] POST / handler called`);
    console.log(`📍 [ROUTE] Body in route:`, req.body);
    console.log(`📍 [ROUTE] About to call next() to auth middleware...`);
    console.log(`📍 [ROUTE] Protect middleware:`, typeof protect);
    try {
      next();
      console.log(`📍 [ROUTE] next() called successfully`);
    } catch (error) {
      console.error(`📍 [ROUTE] Error calling next():`, error);
    }
  }, 
  (req, res, next) => {
    console.log(`🔧 [MIDDLEWARE] Before protect - this should be protect middleware`);
    if (typeof protect === 'function') {
      console.log(`🔧 [MIDDLEWARE] Calling protect function...`);
      return protect()(req, res, next);
    } else {
      console.error(`🔧 [MIDDLEWARE] protect is not a function:`, typeof protect);
      next();
    }
  },
  controller.create
);           // POST /api/departure-dates
router.put("/:id", protect, controller.update);         // PUT /api/departure-dates/:id
router.delete("/:id",
  (req, res, next) => {
    console.log(`📍 [ROUTE] DELETE /:id handler called with id=${req.params.id}`);
    console.log(`📍 [ROUTE] About to call next() to auth middleware...`);
    try {
      next();
      console.log(`📍 [ROUTE] next() called successfully for delete`);
    } catch (error) {
      console.error(`📍 [ROUTE] Error calling next() for delete:`, error);
    }
  },
  (req, res, next) => {
    console.log(`🔧 [MIDDLEWARE] Before protect - this should be protect middleware`);
    if (typeof protect === 'function') {
      console.log(`🔧 [MIDDLEWARE] Calling protect function...`);
      return protect()(req, res, next);
    } else {
      console.error(`🔧 [MIDDLEWARE] protect is not a function:`, typeof protect);
      next();
    }
  },
  controller.delete
);      // DELETE /api/departure-dates/:id

// Custom: Lấy theo tour_id
router.get("/by-tour/:tourId", async (req, res) => {
  try {
    const { DepartureDate } = require("../models");
    const tourId = req.params.tourId;
    const data = await DepartureDate.findAll({
      where: { tour_id: tourId },
      order: [["departure_date", "ASC"]],
    });
    res.json(data);
  } catch (error) {
    console.error("Error fetching departure dates by tour_id:", error);
    res.status(500).json({ error: "Lỗi khi lấy theo tour_id", details: error.message });
  }
});

module.exports = router;
