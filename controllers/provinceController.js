const { Location, Destination } = require("../models");
const provinces = require("../data/provinces.json");
const { Op, fn, col, where } = require("sequelize");

exports.searchAvailableTours = async (req, res) => {
  const { keyword = "", region } = req.query;
  const kw = keyword.toLowerCase(); // chuyển về thường để so sánh

  // B1: Lọc tên tỉnh theo miền từ provinces.json
  let provinceNames = [];
  if (region) {
    provinceNames = provinces
      .filter(p => p.region.toLowerCase() === region.toLowerCase())
      .map(p => p.name);
  }

  try {
    const locations = await Location.findAll({
      where: {
        [Op.and]: [
          // Nếu có lọc theo miền
          region ? { name: { [Op.in]: provinceNames } } : {},

          // So sánh không phân biệt hoa thường
          where(fn('LOWER', col('Location.name')), {
            [Op.like]: `%${kw}%`
          })
        ]
      },
      include: [
        {
          model: Destination,
          as: "destinations",
          required: true // chỉ lấy những tỉnh có destination
        }
      ]
    });

    if (locations.length === 0) {
      return res.status(404).json({ message: "Không có sẵn tour" });
    }

    const result = locations.map(loc => ({
      location: loc.name,
      destinations: loc.destinations.map(dest => dest.name)
    }));

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
