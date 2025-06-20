const { TourHotel, Tour, Hotel } = require("../models");

module.exports = {
  async getAll(req, res) {
    try {
      const data = await TourHotel.findAll({
        include: [
          { model: Tour, as: "tour" },
          { model: Hotel, as: "hotel" },
        ],
      });
      res.json(data);
    } catch (error) {
      console.error("Lỗi getAll tour_hotel:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const item = await TourHotel.findByPk(req.params.id, {
        include: [
          { model: Tour, as: "tour" },
          { model: Hotel, as: "hotel" },
        ],
      });
      if (!item) return res.status(404).json({ message: "Không tìm thấy!" });
      res.json(item);
    } catch (error) {
      console.error("Lỗi getById tour_hotel:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const newItem = await TourHotel.create(req.body);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Lỗi create tour_hotel:", error);
      res.status(500).json({ error: error.message });
    }
  }
};
