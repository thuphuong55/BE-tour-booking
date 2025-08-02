const { Review, Booking, User, Tour, Agency } = require("../models");
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

    if (comment && leoProfanity.check(comment)) {
      return res.status(400).json({ message: "Bình luận chứa nội dung không phù hợp. Vui lòng sửa lại nội dung." });
    }

    const review = await Review.create({
      booking_id,
      tour_id,
      user_id,
      rating,
      comment,
      status: 'pending' // Trạng thái chờ duyệt
    });

    // TODO: Thông báo cho Admin về đánh giá mới cần duyệt
    
    res.status(201).json({ message: "Đánh giá đã được gửi và đang chờ duyệt", data: review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
};

exports.getTourReviews = async (req, res) => {
  try {
    const { tourId } = req.params;
    const reviews = await Review.findAll({
      where: { 
        tour_id: tourId,
        status: 'approved' // Chỉ hiển thị đánh giá đã được duyệt
      },
      include: [{ model: User, as: "user" }],
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
      return res.status(400).json({ message: "Bình luận chứa nội dung không phù hợp. Vui lòng sửa lại nội dung." });
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

// Agency phản hồi đánh giá
exports.replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    const agencyId = req.user.id;

    if (!reply) {
      return res.status(400).json({ message: "Nội dung phản hồi không được để trống" });
    }

    if (leoProfanity.check(reply)) {
      return res.status(400).json({ message: "Nội dung phản hồi chứa từ ngữ không phù hợp" });
    }

    const review = await Review.findByPk(id, {
      include: [{
        model: Tour,
        attributes: ['id', 'agency_id']
      }]
    });

    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    // Kiểm tra quyền: chỉ agency của tour mới được phản hồi
    if (review.Tour.agency_id !== agencyId) {
      return res.status(403).json({ message: "Bạn không có quyền phản hồi đánh giá này" });
    }

    // Kiểm tra đánh giá đã được duyệt chưa
    if (review.status !== 'approved') {
      return res.status(400).json({ message: "Chỉ có thể phản hồi đánh giá đã được duyệt" });
    }

    review.agency_reply = reply;
    review.agency_reply_date = new Date();
    await review.save();

    res.json({ 
      message: "Phản hồi đã được gửi thành công", 
      data: { 
        review_id: review.id, 
        agency_reply: review.agency_reply,
        reply_date: review.agency_reply_date
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi gửi phản hồi" });
  }
};

// Lấy danh sách đánh giá cần duyệt (Admin)
exports.getPendingReviews = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập" });
    }

    const reviews = await Review.findAll({
      where: { status: 'pending' },
      include: [
        { model: User, as: "user", attributes: ['id', 'name', 'email'] },
        { model: Tour, attributes: ['id', 'name', 'agency_id'] }
      ],
      order: [["created_at", "ASC"]]
    });

    res.json({ data: reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Không thể tải danh sách đánh giá chờ duyệt" });
  }
};

// Admin duyệt/từ chối đánh giá
exports.approveReview = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Chỉ admin mới có quyền duyệt đánh giá" });
    }

    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve' hoặc 'reject'

    const review = await Review.findByPk(id, {
      include: [{ model: Tour, attributes: ['id', 'name', 'agency_id'] }]
    });

    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    if (review.status !== 'pending') {
      return res.status(400).json({ message: "Đánh giá này đã được xử lý" });
    }

    if (action === 'approve') {
      review.status = 'approved';
      review.approved_at = new Date();
      review.approved_by = req.user.id;
      
      // TODO: Thông báo cho Agency về đánh giá mới được duyệt
      
      await review.save();
      res.json({ message: "Đã phê duyệt đánh giá", data: review });
    } else if (action === 'reject') {
      review.status = 'rejected';
      review.rejected_at = new Date();
      review.rejected_by = req.user.id;
      review.rejection_reason = reason;
      
      await review.save();
      res.json({ message: "Đã từ chối đánh giá", data: review });
    } else {
      return res.status(400).json({ message: "Hành động không hợp lệ. Sử dụng 'approve' hoặc 'reject'" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xử lý đánh giá" });
  }
};

// Lấy danh sách đánh giá của agency
exports.getAgencyReviews = async (req, res) => {
  try {
    if (req.user.role !== 'agency') {
      return res.status(403).json({ message: "Chỉ agency mới có quyền truy cập" });
    }

    const agencyId = req.user.id;
    const { status } = req.query; // optional filter by status

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const reviews = await Review.findAll({
      where: whereClause,
      include: [
        { model: User, as: "user", attributes: ['id', 'name', 'email'] },
        { 
          model: Tour, 
          where: { agency_id: agencyId },
          attributes: ['id', 'name', 'agency_id'] 
        }
      ],
      order: [["created_at", "DESC"]]
    });

    res.json({ data: reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Không thể tải danh sách đánh giá" });
  }
};

