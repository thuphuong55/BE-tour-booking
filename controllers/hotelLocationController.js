const { Hotel, Location } = require('../models');

const hotelController = {
  // Lấy tất cả khách sạn với thông tin địa điểm
  async getAllHotels(req, res) {
    try {
      const hotels = await Hotel.findAll({
        include: [{
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'description']
        }]
      });

      res.status(200).json({
        success: true,
        data: hotels
      });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách khách sạn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách khách sạn',
        error: error.message
      });
    }
  },

  // Lọc khách sạn theo địa điểm (location_id)
  async getHotelsByLocation(req, res) {
    try {
      const { locationId } = req.params;

      // Kiểm tra địa điểm có tồn tại không
      const location = await Location.findByPk(locationId);
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy địa điểm'
        });
      }

      // Lấy khách sạn theo địa điểm
      const hotels = await Hotel.findAll({
        where: { location_id: locationId },
        include: [{
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'description']
        }]
      });

      res.status(200).json({
        success: true,
        message: `Tìm thấy ${hotels.length} khách sạn tại ${location.name}`,
        data: {
          location: {
            id: location.id,
            name: location.name,
            description: location.description
          },
          hotels: hotels
        }
      });
    } catch (error) {
      console.error('Lỗi khi lọc khách sạn theo địa điểm:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lọc khách sạn',
        error: error.message
      });
    }
  },

  // Cập nhật địa điểm cho khách sạn
  async updateHotelLocation(req, res) {
    try {
      const { hotelId } = req.params;
      const { location_id } = req.body;

      // Kiểm tra khách sạn có tồn tại không
      const hotel = await Hotel.findByPk(hotelId);
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khách sạn'
        });
      }

      // Kiểm tra địa điểm có tồn tại không (nếu có)
      if (location_id) {
        const location = await Location.findByPk(location_id);
        if (!location) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy địa điểm'
          });
        }
      }

      // Cập nhật địa điểm cho khách sạn
      await hotel.update({ location_id });

      // Lấy thông tin khách sạn sau khi cập nhật
      const updatedHotel = await Hotel.findByPk(hotelId, {
        include: [{
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'description']
        }]
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật địa điểm cho khách sạn thành công',
        data: updatedHotel
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật địa điểm khách sạn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật khách sạn',
        error: error.message
      });
    }
  }
};

module.exports = hotelController;
