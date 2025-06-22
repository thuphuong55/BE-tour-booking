const { TourCategory, Tour } = require("../models");

// GET /categories
const getAll = async (req, res) => {
  try {
    const categories = await TourCategory.findAll();
    res.json(categories);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách danh mục:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// GET /categories/:id
const getById = async (req, res) => {
  try {
    const category = await TourCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục!" });
    }
    res.json(category);
  } catch (err) {
    console.error("Lỗi khi lấy danh mục:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// POST /categories
const create = async (req, res) => {
  try {
    const category = await TourCategory.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    console.error("Lỗi khi tạo danh mục:", err);
    res.status(400).json({ message: "Dữ liệu không hợp lệ", error: err.message });
  }
};

// PUT /categories/:id
const update = async (req, res) => {
  try {
    const category = await TourCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục!" });
    }

    await category.update(req.body);
    res.json(category);
  } catch (err) {
    console.error("Lỗi khi cập nhật danh mục:", err);
    res.status(400).json({ message: "Dữ liệu cập nhật không hợp lệ", error: err.message });
  }
};

// DELETE /categories/:id
const remove = async (req, res) => {
  try {
    const category = await TourCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục!" });
    }

    await category.destroy();
    res.json({ message: "Đã xoá danh mục" });
  } catch (err) {
    console.error("Lỗi khi xoá danh mục:", err);
    res.status(500).json({ message: "Xoá thất bại" });
  }
};

// GET /categories/:id/tours
const getCategoryWithTours = async (req, res) => {
  try {
    const category = await TourCategory.findByPk(req.params.id, {
      include: [{ model: Tour, as: "tours" }]
    });

    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục!" });
    }

    res.json(category);
  } catch (error) {
    console.error("Lỗi lấy danh mục và tour:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  getCategoryWithTours
};
