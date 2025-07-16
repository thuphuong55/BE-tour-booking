const { Review, Booking, User, Tour } = require("../models");
const leoProfanity = require("../utils/profanity");


exports.createReview = async (req, res) => {
  try {
    const { booking_id, tour_id, rating, comment } = req.body;
    const user_id = req.user.id; // lấy từ middleware auth

    if (!booking_id || !tour_id || !rating)
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });

    const booking = await Booking.findOne({ where: { id: booking_id, user_id } });
    if (!booking)
      return res.status(403).json({ message: "Booking không hợp lệ." });

    //Kiểm tra đã từng đánh giá chưa
    const existed = await Review.findOne({ where: { booking_id } });
    if (existed)
      return res.status(409).json({ message: "Bạn đã đánh giá booking này rồi." });

    if (leoProfanity.check(comment)) {
      return res.status(401).json({ message: "Bình luận chứa nội dung không phù hợp." });
    }

    const review = await Review.create({
      booking_id,
      tour_id,
      user_id,
      rating,
      comment
    });

    res.status(201).json({ message: "Đánh giá thành công", data: review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
};

exports.getTourReviews = async (req, res) => {
  try {
    const { tourId } = req.params;
    const reviews = await Review.findAll({
      where: { tour_id: tourId },
      include: {
        model: User,
        attributes: ["id", "name"]
      },
      order: [["review_date", "DESC"]]
    });

    res.json({ data: reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Không thể tải danh sách đánh giá" });
  }
};

exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { user_id: req.user.id },
      include: {
        model: Tour,
        attributes: ["id", "name"]
      }
    });

    res.json({ data: reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Không thể tải đánh giá của bạn" });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);

    if (!review || review.user_id !== req.user.id)
      return res.status(403).json({ message: "Không có quyền chỉnh sửa đánh giá này" });

    const { rating, comment } = req.body;

    if (!rating && !comment)
      return res.status(400).json({ message: "Không có dữ liệu cập nhật" });

    if (comment && leoProfanity.check(comment)) {
      return res.status(401).json({ message: "Bình luận chứa nội dung không phù hợp." });
    }

    if (rating)  review.rating  = rating;
    if (comment) review.comment = comment;

    await review.save();

    res.json({ message: "Đã cập nhật đánh giá", data: review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật đánh giá" });
  }
};
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá" });

    const isOwner = review.user_id === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Bạn không có quyền xóa đánh giá này" });
    }

    await review.destroy();
    res.json({ message: "Đã xóa đánh giá" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa đánh giá" });
  }
};

