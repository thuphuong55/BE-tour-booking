const { InformationBookingTour } = require("../models");

// GET /api/information-booking
const getAll = async (req, res) => {
  try {
    const { booking_id } = req.query;

    const whereClause = booking_id ? { booking_id } : undefined;
    const guests = await InformationBookingTour.findAll({ where: whereClause });

    res.json(guests);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách người đặt", error: err.message });
  }
};

// GET /api/information-booking/:id
const getById = async (req, res) => {
  try {
    const guest = await InformationBookingTour.findByPk(req.params.id);
    if (!guest) return res.status(404).json({ message: "Không tìm thấy người đặt" });

    res.json(guest);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// POST /api/information-booking
const create = async (req, res) => {
  try {
    const guest = await InformationBookingTour.create(req.body);
    res.status(201).json(guest);
  } catch (err) {
    res.status(400).json({ message: "Tạo người đặt thất bại", error: err.message });
  }
};

// PUT /api/information-booking/:id
const update = async (req, res) => {
  try {
    const guest = await InformationBookingTour.findByPk(req.params.id);
    if (!guest) return res.status(404).json({ message: "Không tìm thấy người đặt" });

    await guest.update(req.body);
    res.json(guest);
  } catch (err) {
    res.status(400).json({ message: "Cập nhật thất bại", error: err.message });
  }
};

// DELETE /api/information-booking/:id
const remove = async (req, res) => {
  try {
    const guest = await InformationBookingTour.findByPk(req.params.id);
    if (!guest) return res.status(404).json({ message: "Không tìm thấy người đặt" });

    await guest.destroy();
    res.json({ message: "Đã xoá người đặt thành công" });
  } catch (err) {
    res.status(500).json({ message: "Xoá thất bại", error: err.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: remove
};
