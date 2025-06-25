module.exports = function generateCrudController(Model, include = []) {
  return {
    // Lấy toàn bộ dữ liệu
    getAll: async (req, res) => {
      try {
        const data = await Model.findAll({ include });
        res.json(data);
      } catch (err) {
        console.error("Lỗi getAll:", err);
        res.status(500).json({ message: "Lỗi server", error: err.message });
      }
    },

    // Lấy 1 bản ghi theo ID
    getById: async (req, res) => {
      try {
        const item = await Model.findByPk(req.params.id, { include });
        if (!item) return res.status(404).json({ message: "Không tìm thấy" });
        res.json(item);
      } catch (err) {
        console.error("Lỗi getById:", err);
        res.status(500).json({ message: "Lỗi server", error: err.message });
      }
    },

    // Tạo mới (mặc định — có thể override ở controller cụ thể)
    create: async (req, res) => {
      try {
        const item = await Model.create(req.body);
        res.status(201).json(item);
      } catch (err) {
        console.error("Lỗi create:", err);
        res.status(400).json({ message: "Tạo thất bại", error: err.message });
      }
    },

    // Cập nhật
    update: async (req, res) => {
      try {
        const item = await Model.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: "Không tìm thấy" });
        await item.update(req.body);
        res.json(item);
      } catch (err) {
        console.error("Lỗi update:", err);
        res.status(400).json({ message: "Cập nhật thất bại", error: err.message });
      }
    },

    // Xoá
    delete: async (req, res) => {
      try {
        const item = await Model.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: "Không tìm thấy" });
        await item.destroy();
        res.json({ message: "Đã xoá thành công" });
      } catch (err) {
        console.error("Lỗi delete:", err);
        res.status(500).json({ message: "Xoá thất bại", error: err.message });
      }
    }
  };
};
