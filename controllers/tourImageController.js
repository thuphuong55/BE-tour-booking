const { TourImage, Tour } = require("../models");


// ✅ Lấy tất cả ảnh của 1 tour
const getByTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const images = await TourImage.findAll({ where: { tour_id: tourId } });
    res.json(images);
  } catch (err) {
    console.error("Lỗi khi lấy ảnh tour:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ✅ Tạo ảnh mới cho tour
const create = async (req, res) => {
  try {
    const { tour_id, image_url, is_main } = req.body;

    // Nếu chọn ảnh là ảnh chính → reset các ảnh khác về false
    if (is_main === true) {
      await TourImage.update({ is_main: false }, { where: { tour_id } });
    }

    const newImage = await TourImage.create({
      tour_id,
      image_url,
      is_main: !!is_main
    });

    res.status(201).json(newImage);
  } catch (err) {
    console.error("Lỗi khi tạo ảnh tour:", err);
    res.status(400).json({ message: "Lỗi dữ liệu ảnh", error: err.message });
  }
};

// ✅ Cập nhật ảnh (chỉ cập nhật is_main)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_main } = req.body;

    const image = await TourImage.findByPk(id);
    if (!image) return res.status(404).json({ message: "Không tìm thấy ảnh" });

    // Nếu set là ảnh chính → reset các ảnh khác
    if (is_main === true) {
      await TourImage.update({ is_main: false }, { where: { tour_id: image.tour_id } });
    }

    await image.update({ is_main });

    res.json(image);
  } catch (err) {
    console.error("Lỗi khi cập nhật ảnh:", err);
    res.status(400).json({ message: "Cập nhật ảnh lỗi", error: err.message });
  }
};

// ✅ Xoá ảnh
const remove = async (req, res) => {
  try {
    const image = await TourImage.findByPk(req.params.id);
    if (!image) return res.status(404).json({ message: "Không tìm thấy ảnh" });

    await image.destroy();
    res.json({ message: "Đã xoá ảnh thành công" });
  } catch (err) {
    console.error("Lỗi khi xoá ảnh:", err);
    res.status(500).json({ message: "Xoá ảnh thất bại" });
  }
};

module.exports = {
  getByTour,
  create,
  update,
  delete: remove
};
