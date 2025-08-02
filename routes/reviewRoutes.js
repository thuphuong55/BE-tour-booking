const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middlewares/auth"); 

router.post("/", protect(), reviewController.createReview);
router.get("/me", protect(["user"]), reviewController.getMyReviews);
router.delete("/:id", protect(["user", "admin"]), reviewController.deleteReview);

router.get("/tour/:tourId", reviewController.getTourReviews); // tất cả review cho 1 tour

module.exports = router;
