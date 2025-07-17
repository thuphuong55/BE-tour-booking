const { Tour, DepartureDate, TourImage, IncludedService, TourCategory, Promotion } = require("../models");

// Lấy tất cả tour kèm các ngày khởi hành và ảnh, giảm giá nếu có
const getAll = async (req, res) => {
  try {
    const tours = await Tour.findAll({
      include: [
        {
          model: DepartureDate,
          as: 'departureDates',
          attributes: [
            ['id', 'departureDates_id'],
            'departure_date',
            'end_date',
            'number_of_days',
            'number_of_nights'
          ]
        },
        {
          model: TourImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main']
        },
        {
          model: Promotion,
          as: 'promotion'
        }
      ]
    });

    const now = new Date();

    // Áp dụng giảm giá nếu promotion đang còn hiệu lực
    const tourWithFinalPrices = tours.map((tour) => {
      const tourData = tour.toJSON();

      let final_price = tour.price;
      if (
        tour.promotion &&
        new Date(tour.promotion.start_date) <= now &&
        new Date(tour.promotion.end_date) >= now
      ) {
        final_price = Math.max(0, tour.price - parseFloat(tour.promotion.discount_amount));
      }

      return {
        ...tourData,
        final_price,
        promotion_applied: tour.promotion?.code || null
      };
    });

    res.json(tourWithFinalPrices);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách tour:", err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const getById = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
      include: [
        {
          model: DepartureDate,
          as: 'departureDates',
          attributes: [
            ['id', 'departureDates_id'],
            'departure_date',
            'end_date',
            'number_of_days',
            'number_of_nights'
          ]
        },
        {
          model: TourImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main']
        },
        {
          model: Promotion,
          as: 'promotion' 
        }
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    // Tính giá sau khuyến mãi nếu đang trong thời gian hiệu lực
    let final_price = tour.price;
    const now = new Date();

    if (
      tour.promotion &&
      new Date(tour.promotion.start_date) <= now &&
      new Date(tour.promotion.end_date) >= now
    ) {
      final_price = Math.max(0, tour.price - parseFloat(tour.promotion.discount_amount));
    }

    res.json({
      ...tour.toJSON(),
      final_price,
      promotion_applied: tour.promotion?.code || null
    });
  } catch (err) {
    console.error("Lỗi khi lấy tour theo ID:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Tạo tour mới
const create = async (req, res) => {
  try {
    const {
      hotel_ids = [],
      category_ids = [],
      included_service_ids = [],
      promotion_id = null,
      ...tourData
    } = req.body;

    const tour = await Tour.create({
      ...tourData,
      promotion_id
    });

    // Load lại tour đã tạo cùng với promotion
    const fullTour = await Tour.findByPk(tour.id, {
      include: [{ model: Promotion, as: 'promotion' }]
    });

    // Tính final_price nếu có giảm giá
    let final_price = fullTour.price;
    const now = new Date();

    if (
      fullTour.promotion &&
      new Date(fullTour.promotion.start_date) <= now &&
      new Date(fullTour.promotion.end_date) >= now
    ) {
      final_price = Math.max(0, fullTour.price - parseFloat(fullTour.promotion.discount_amount));
    }

    res.status(201).json({
      ...fullTour.toJSON(),
      final_price,
      promotion_applied: fullTour.promotion?.code || null
    });
  } catch (err) {
    console.error("Lỗi khi tạo tour:", err);
    res.status(400).json({ message: "Lỗi tạo tour", error: err.message });
  }
};


// Cập nhật tour
const update = async (req, res) => {
  try {
    const {
      hotel_ids = [],
      category_ids = [],
      included_service_ids = [],
      promotion_id = null,
      ...tourData
    } = req.body;

    const tour = await Tour.findByPk(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    await tour.update({ ...tourData, promotion_id });

    //Cập nhật lại quan hệ Nhiều-Nhiều
    if (hotel_ids.length > 0) await tour.setHotels(hotel_ids);
    else await tour.setHotels([]); // clear nếu bỏ chọn hết

    if (category_ids.length > 0) await tour.setCategories(category_ids);
    else await tour.setCategories([]);

    if (included_service_ids.length > 0) await tour.setIncludedServices(included_service_ids);
    else await tour.setIncludedServices([]);

    res.json(tour);
  } catch (err) {
    console.error("Lỗi khi cập nhật tour:", err);
    res.status(400).json({ message: "Dữ liệu cập nhật không hợp lệ", error: err.message });
  }
};


// Xoá tour
const remove = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    await tour.destroy();
    res.json({ message: "Đã xoá tour" });
  } catch (err) {
    console.error("Lỗi khi xoá tour:", err);
    res.status(500).json({ message: "Xoá thất bại" });
  }
};

// Lấy tour + ngày khởi hành (API riêng)
const getTourWithDepartures = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
      include: [
        {
          model: DepartureDate,
          as: 'departureDates',
          attributes: [
            ['id', 'departureDates_id'],
            'departure_date',
            'end_date',
            'number_of_days',
            'number_of_nights'
          ]
        }
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    res.json(tour);
  } catch (err) {
    console.error("Lỗi khi lấy tour + departureDates:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy tour + danh mục (categories)
const getTourWithCategories = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
      include: [
        {
          model: TourCategory,
          as: "categories"
        }
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour!" });
    }

    res.json(tour);
  } catch (err) {
    console.error("Lỗi khi lấy tour + categories:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy tour + các dịch vụ bao gồm
const getTourWithIncludedServices = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
      include: [
        {
          model: IncludedService,
          as: "includedServices"
        }
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour!" });
    }

    res.json(tour);
  } catch (err) {
    console.error("Lỗi khi lấy tour + included services:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Gán dịch vụ cho tour
const assignIncludedServiceToTour = async (req, res) => {
  const { tourId, serviceId } = req.params;
  try {
    const tour = await Tour.findByPk(tourId);
    const service = await IncludedService.findByPk(serviceId);

    if (!tour || !service) {
      return res.status(404).json({ message: "Không tìm thấy tour hoặc dịch vụ" });
    }

    await tour.addIncludedService(service);
    res.json({ message: "Đã gắn dịch vụ vào tour thành công" });
  } catch (err) {
    console.error("Lỗi khi gắn dịch vụ vào tour:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  getTourWithDepartures,
  getTourWithCategories,
  getTourWithIncludedServices,
  assignIncludedServiceToTour
};
