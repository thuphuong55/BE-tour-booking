const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middlewares/authMiddleware"); 

router.post("/", authMiddleware.protect(), reviewController.createReview);
router.get("/me", authMiddleware.protect(["user"]), reviewController.getMyReviews);
router.delete("/:id", authMiddleware.protect(["user", "admin"]), reviewController.deleteReview);

router.get("/tour/:tourId", reviewController.getTourReviews); // tất cả review cho 1 tour

module.exports = router;
