const { TourCategory, Tour, TourImage, DepartureDate, Promotion } = require("../models");

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
      include: [{
        model: Tour,
        as: "tours",
        include: [
          {
            model: TourImage,
            as: 'images',
            attributes: ['id', 'image_url', 'is_main']
          },
          {
            model: DepartureDate,
            as: 'departureDates',
            attributes: ['id', 'departure_date', 'number_of_days', 'end_date']
          }
        ]
      }]
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

// GET /categories/:id/tours-only - Chỉ lấy tours của category
const getToursByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const category = await TourCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục!" });
    }

    const tours = await Tour.findAndCountAll({
      include: [
        {
          model: TourCategory,
          as: 'categories',
          where: { id: id },
          attributes: []
        },
        {
          model: TourImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main']
        },
        {
          model: DepartureDate,
          as: 'departureDates',
          attributes: ['id', 'departure_date', 'number_of_days', 'end_date']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      category: category,
      tours: tours.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(tours.count / limit),
        totalTours: tours.count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Lỗi lấy tours theo category:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  getCategoryWithTours,
  getToursByCategory
};
