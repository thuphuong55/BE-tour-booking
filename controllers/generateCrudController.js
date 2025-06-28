module.exports = (Model, include = []) => {
  // Chuẩn hoá: nếu dev truyền { include: [...] } thì rút gọn về [...]
  const defaultInclude = Array.isArray(include) ? include : include.include || [];

  return {
    async getAll(req, res) {
      try {
        const rows = await Model.findAll({ include: defaultInclude });
        res.json(rows);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    },

    async getById(req, res) {
      try {
        const row = await Model.findByPk(req.params.id, { include: defaultInclude });
        if (!row) return res.status(404).json({ error: "Not found" });
        res.json(row);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    },

    async create(req, res) {
      try {
        const row = await Model.create(req.body);
        res.status(201).json(row);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    },

    async update(req, res) {
      try {
        const [count] = await Model.update(req.body, { where: { id: req.params.id } });
        if (!count) return res.status(404).json({ error: "Not found" });
        const row = await Model.findByPk(req.params.id, { include: defaultInclude });
        res.json(row);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
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
