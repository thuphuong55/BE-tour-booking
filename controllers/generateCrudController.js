function generateCrudController(model) {
  return {
    async getAll(req, res) {
      try {
        const items = await model.findAll();
        res.json(items);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },

    async getById(req, res) {
      try {
        const item = await model.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: "Not found" });
        res.json(item);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },

    async create(req, res) {
      try {
        const item = await model.create(req.body);
        res.status(201).json(item);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },

    async update(req, res) {
      try {
        const item = await model.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: "Not found" });
        await item.update(req.body);
        res.json(item);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },

    async delete(req, res) {
      try {
        const item = await model.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: "Not found" });
        await item.destroy();
        res.json({ message: "Deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  };
}

module.exports = generateCrudController;
