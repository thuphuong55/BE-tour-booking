const { SearchLog, sequelize, Location } = require("../models");
const { Op } = require("sequelize");



exports.logSearch = async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
    }

    await SearchLog.create({ keyword: keyword.trim() });

    res.status(201).json({ message: "Đã ghi log tìm kiếm" });
  } catch (error) {
    console.error("Lỗi ghi log:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getTopSearchLocations = async (req, res) => {
  try {
    const [topKeywords] = await sequelize.query(`
      SELECT keyword, COUNT(*) as count
      FROM search_logs
      GROUP BY keyword
      ORDER BY count DESC
      LIMIT 5;
    `);

    const keywords = topKeywords.map(k => k.keyword);

    const { Op } = require('sequelize');
    const locations = await Location.findAll({
      where: {
        [Op.or]: keywords.map(k => ({
          name: { [Op.like]: `%${k}%` }
        }))
      },
      attributes: ["id", "name", "image_url", "description"]
    });

    res.json({ locations });
  } catch (err) {
    console.error("Lỗi lấy top tỉnh thành nổi bật:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
