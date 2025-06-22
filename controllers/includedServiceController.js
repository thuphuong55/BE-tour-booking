const { IncludedService } = require("../models");

// Lấy tất cả dịch vụ bao gồm
const getAll = async (req, res) => {
  try {
    const services = await IncludedService.findAll();
    res.json(services);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách dịch vụ:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy dịch vụ theo ID
const getById = async (req, res) => {
  try {
    const service = await IncludedService.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    res.json(service);
  } catch (err) {
    console.error("Lỗi khi lấy dịch vụ:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Tạo mới dịch vụ
const create = async (req, res) => {
  try {
    const service = await IncludedService.create(req.body);
    res.status(201).json(service);
  } catch (err) {
    console.error("Lỗi khi tạo dịch vụ:", err);
    res.status(400).json({ message: "Dữ liệu không hợp lệ", error: err.message });
  }
};

// Cập nhật dịch vụ
const update = async (req, res) => {
  try {
    const service = await IncludedService.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    await service.update(req.body);
    res.json(service);
  } catch (err) {
    console.error("Lỗi khi cập nhật dịch vụ:", err);
    res.status(400).json({ message: "Dữ liệu không hợp lệ", error: err.message });
  }
};

// Xoá dịch vụ
const remove = async (req, res) => {
  try {
    const service = await IncludedService.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    await service.destroy();
    res.json({ message: "Đã xoá dịch vụ" });
  } catch (err) {
    console.error("Lỗi khi xoá dịch vụ:", err);
    res.status(500).json({ message: "Xoá thất bại" });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: remove
};
