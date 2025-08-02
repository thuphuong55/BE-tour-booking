const { Tour, DepartureDate, TourImage, IncludedService, TourCategory, Hotel, ExcludedService, Itinerary, Location, Promotion, Agency, Destination, User } = require("../models");
const mailer = require("../config/mailer");

// 📋 Admin - Lấy tất cả tours với phân trang và filter nâng cao
const getAllTours = async (req, res) => {
  try {
    console.log("🔍 Admin getAllTours - Query params:", req.query);
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Filter parameters
    const status = req.query.status;
    const agency_id = req.query.agency_id;
    const search = req.query.search;
    const tour_type = req.query.tour_type;
    const created_from = req.query.created_from;
    const created_to = req.query.created_to;
    
    // Build where clause
    let where = {};
    const { Op } = require("sequelize");
    
    // Status filter
    if (status) {
      where.status = status;
    }
    
    // Agency filter
    if (agency_id) {
      where.agency_id = agency_id;
    }
    
    // Tour type filter
    if (tour_type) {
      where.tour_type = tour_type;
    }
    
    // Date range filter
    if (created_from || created_to) {
      where.created_at = {};
      if (created_from) {
        where.created_at[Op.gte] = new Date(created_from);
      }
      if (created_to) {
        where.created_at[Op.lte] = new Date(created_to);
      }
    }
    
    // Search filter (name, location, destination)
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
        { destination: { [Op.iLike]: `%${search}%` } }
      ];
    }

    console.log("🔍 Admin query where clause:", JSON.stringify(where, null, 2));

    const { count, rows: tours } = await Tour.findAndCountAll({
      where,
      include: [
        {
          model: DepartureDate,
          as: 'departureDates',
          attributes: ['id', 'departure_date', 'end_date', 'number_of_days', 'number_of_nights']
        },
        {
          model: TourImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main']
        },
        {
          model: Promotion,
          as: 'promotion',
          attributes: ['id', 'code', 'description', 'discount_amount'],
          required: false
        },
        {
          model: Agency,
          as: 'agency',
          attributes: ['id', 'name', 'status'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['email', 'name']
            }
          ]
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    console.log(`📊 Admin tours result: ${tours.length}/${count} tours, page ${page}/${totalPages}`);

    res.json({
      success: true,
      data: {
        tours,
        pagination: {
          page,
          limit,
          total: count,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          status,
          agency_id,
          search,
          tour_type,
          created_from,
          created_to
        }
      }
    });
  } catch (err) {
    console.error("❌ Error in admin getAllTours:", err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi lấy danh sách tour', 
      error: err.message 
    });
  }
};

// 📊 Admin - Thống kê tours theo trạng thái
const getTourStats = async (req, res) => {
  try {
    console.log("📊 Admin getTourStats");
    
    const { Op } = require("sequelize");
    
    // Count by status
    const statusStats = await Tour.findAll({
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['status']
    });
    
    // Count by tour type
    const typeStats = await Tour.findAll({
      attributes: [
        'tour_type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['tour_type']
    });
    
    // Recent tours (last 7 days)
    const recentTours = await Tour.count({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    // Pending approval count
    const pendingCount = await Tour.count({
      where: { status: 'Chờ duyệt' }
    });
    
    res.json({
      success: true,
      data: {
        statusStats: statusStats.map(stat => ({
          status: stat.status,
          count: parseInt(stat.dataValues.count)
        })),
        typeStats: typeStats.map(stat => ({
          type: stat.tour_type,
          count: parseInt(stat.dataValues.count)
        })),
        recentTours,
        pendingCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("❌ Error in admin getTourStats:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy thống kê tour', 
      error: err.message 
    });
  }
};

// 📋 Admin - Lấy tour theo ID với đầy đủ thông tin
const getTour = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Admin getTour - ID: ${id}`);
    
    const tour = await Tour.findByPk(id, {
      include: [
        {
          model: Agency,
          as: 'agency',
          include: [{ 
            model: User, 
            as: 'user',
            attributes: ['email', 'name']
          }]
        },
        {
          model: DepartureDate,
          as: 'departureDates',
          order: [['departure_date', 'ASC']]
        },
        {
          model: TourImage,
          as: 'images'
        },
        {
          model: Promotion,
          as: 'promotion',
          attributes: ['id', 'code', 'description', 'discount_amount', 'start_date', 'end_date']
        },
        {
          model: TourCategory,
          as: 'categories',
          through: { attributes: [] }
        },
        {
          model: IncludedService,
          as: 'includedServices',
          through: { attributes: [] }
        },
        {
          model: ExcludedService,
          as: 'excludedServices',
          through: { attributes: [] }
        },
        {
          model: Hotel,
          as: 'hotels',
          through: { attributes: [] }
        },
        {
          model: Itinerary,
          as: 'itineraries',
          include: [{ 
            model: Location, 
            as: 'locations',
            through: { attributes: [] } // Explicitly specify through attributes
          }]
        }
      ]
    });
    
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tour'
      });
    }
    
    console.log(`✅ Admin getTour success - Tour: ${tour.name}`);
    res.json({
      success: true,
      data: tour
    });
    
  } catch (err) {
    console.error("❌ Error in admin getTour:", err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin tour',
      error: err.message
    });
  }
};// ✅ Admin - Duyệt tour
const approveTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log(`✅ Admin approving tour ${id} with reason:`, reason);
    
    // Tìm tour
    const tour = await Tour.findByPk(id, {
      include: [
        {
          model: Agency,
          as: 'agency',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });
    
    if (!tour) {
      return res.status(404).json({ success: false, message: "Tour không tồn tại" });
    }
    
    // Kiểm tra trạng thái hiện tại
    if (tour.status !== 'Chờ duyệt') {
      return res.status(400).json({ 
        success: false,
        message: `Không thể duyệt tour có trạng thái '${tour.status}'` 
      });
    }
    
    const oldStatus = tour.status;
    
    // Cập nhật trạng thái
    await tour.update({ status: 'Đang hoạt động' });
    
    console.log(`✅ Tour ${id} approved: ${oldStatus} → Đang hoạt động`);
    
    // Gửi email thông báo cho agency
    if (tour.agency && tour.agency.user && tour.agency.user.email) {
      try {
        await mailer.sendMail({
          to: tour.agency.user.email,
          subject: `✅ Tour "${tour.name}" đã được duyệt`,
          html: `
            <h2>🎉 Chúc mừng! Tour của bạn đã được duyệt</h2>
            <p><strong>Tour:</strong> ${tour.name}</p>
            <p><strong>Trạng thái:</strong> Đang hoạt động</p>
            <p><strong>Lý do:</strong> ${reason || 'Tour đã đáp ứng đủ tiêu chuẩn chất lượng'}</p>
            <p><strong>Thời gian duyệt:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            <hr>
            <p>Tour của bạn giờ đây đã có thể được khách hàng đặt booking.</p>
          `
        });
        console.log(`📧 Approval email sent to ${tour.agency.user.email}`);
      } catch (emailErr) {
        console.error("❌ Failed to send approval email:", emailErr);
      }
    }
    
    res.json({
      success: true,
      message: `Tour "${tour.name}" đã được duyệt thành công`,
      data: {
        id: tour.id,
        name: tour.name,
        oldStatus,
        newStatus: 'Đang hoạt động',
        reason,
        approvedAt: new Date().toISOString(),
        approvedBy: req.user.email
      }
    });
  } catch (err) {
    console.error("❌ Error in approveTour:", err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi duyệt tour', 
      error: err.message 
    });
  }
};

// ❌ Admin - Từ chối tour
const rejectTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ 
        success: false,
        message: "Lý do từ chối là bắt buộc" 
      });
    }
    
    console.log(`❌ Admin rejecting tour ${id} with reason:`, reason);
    
    // Tìm tour
    const tour = await Tour.findByPk(id, {
      include: [
        {
          model: Agency,
          as: 'agency',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });
    
    if (!tour) {
      return res.status(404).json({ success: false, message: "Tour không tồn tại" });
    }
    
    // Kiểm tra trạng thái hiện tại
    if (tour.status !== 'Chờ duyệt') {
      return res.status(400).json({ 
        success: false,
        message: `Không thể từ chối tour có trạng thái '${tour.status}'` 
      });
    }
    
    const oldStatus = tour.status;
    
    // Cập nhật trạng thái
    await tour.update({ status: 'Đã hủy' });
    
    console.log(`❌ Tour ${id} rejected: ${oldStatus} → Đã hủy`);
    
    // Gửi email thông báo cho agency
    if (tour.agency && tour.agency.user && tour.agency.user.email) {
      try {
        await mailer.sendMail({
          to: tour.agency.user.email,
          subject: `❌ Tour "${tour.name}" bị từ chối`,
          html: `
            <h2>😔 Tour của bạn bị từ chối</h2>
            <p><strong>Tour:</strong> ${tour.name}</p>
            <p><strong>Trạng thái:</strong> Đã hủy</p>
            <p><strong>Lý do từ chối:</strong> ${reason}</p>
            <p><strong>Thời gian từ chối:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            <hr>
            <p>Bạn có thể sửa đổi tour theo góp ý và gửi lại để được xem xét.</p>
          `
        });
        console.log(`📧 Rejection email sent to ${tour.agency.user.email}`);
      } catch (emailErr) {
        console.error("❌ Failed to send rejection email:", emailErr);
      }
    }
    
    res.json({
      success: true,
      message: `Tour "${tour.name}" đã bị từ chối`,
      data: {
        id: tour.id,
        name: tour.name,
        oldStatus,
        newStatus: 'Đã hủy',
        reason,
        rejectedAt: new Date().toISOString(),
        rejectedBy: req.user.email
      }
    });
  } catch (err) {
    console.error("❌ Error in rejectTour:", err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi từ chối tour', 
      error: err.message 
    });
  }
};

// 🔄 Admin - Cập nhật trạng thái tour (suspend/reactivate)
const updateTourStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    const validStatuses = ['Chờ duyệt', 'Đang hoạt động', 'Ngừng hoạt động', 'Đã hủy'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Trạng thái không hợp lệ",
        validStatuses 
      });
    }
    
    console.log(`🔄 Admin updating tour ${id} status to: ${status}`);
    
    // Tìm tour
    const tour = await Tour.findByPk(id, {
      include: [
        {
          model: Agency,
          as: 'agency',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });
    
    if (!tour) {
      return res.status(404).json({ success: false, message: "Tour không tồn tại" });
    }
    
    const oldStatus = tour.status;
    
    if (oldStatus === status) {
      return res.status(400).json({ 
        success: false,
        message: `Tour đã có trạng thái '${status}'` 
      });
    }
    
    // Cập nhật trạng thái
    await tour.update({ status });
    
    console.log(`🔄 Tour ${id} status updated: ${oldStatus} → ${status}`);
    
    // Gửi email thông báo cho agency (chỉ với một số trạng thái quan trọng)
    if (tour.agency && tour.agency.user && tour.agency.user.email) {
      let shouldSendEmail = false;
      let emailSubject = '';
      let emailContent = '';
      
      if (status === 'Ngừng hoạt động') {
        shouldSendEmail = true;
        emailSubject = `⏸️ Tour "${tour.name}" bị tạm ngừng`;
        emailContent = `
          <h2>⏸️ Tour của bạn bị tạm ngừng hoạt động</h2>
          <p><strong>Tour:</strong> ${tour.name}</p>
          <p><strong>Trạng thái:</strong> Ngừng hoạt động</p>
          <p><strong>Lý do:</strong> ${reason || 'Không có lý do cụ thể'}</p>
          <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        `;
      } else if (status === 'Đang hoạt động' && oldStatus === 'Ngừng hoạt động') {
        shouldSendEmail = true;
        emailSubject = `▶️ Tour "${tour.name}" được mở lại`;
        emailContent = `
          <h2>🎉 Tour của bạn đã được mở lại</h2>
          <p><strong>Tour:</strong> ${tour.name}</p>
          <p><strong>Trạng thái:</strong> Đang hoạt động</p>
          <p><strong>Lý do:</strong> ${reason || 'Tour đã đáp ứng yêu cầu'}</p>
          <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        `;
      }
      
      if (shouldSendEmail) {
        try {
          await mailer.sendMail({
            to: tour.agency.user.email,
            subject: emailSubject,
            html: emailContent
          });
          console.log(`📧 Status change email sent to ${tour.agency.user.email}`);
        } catch (emailErr) {
          console.error("❌ Failed to send status change email:", emailErr);
        }
      }
    }
    
    res.json({
      success: true,
      message: `Đã cập nhật trạng thái tour từ '${oldStatus}' sang '${status}'`,
      data: {
        id: tour.id,
        name: tour.name,
        oldStatus,
        newStatus: status,
        reason,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.email
      }
    });
  } catch (err) {
    console.error("❌ Error in updateTourStatus:", err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi cập nhật trạng thái tour', 
      error: err.message 
    });
  }
};

// ✏️ Admin - Cập nhật đầy đủ thông tin tour
const updateTour = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log("✏️ Admin updating tour", id, "with data:", req.body);
    
    const {
      hotel_ids = [],
      category_ids = [],
      included_service_ids = [],
      selectedIncludedServices = [],
      selectedCategories = [],
      images,
      departureDates,
      destination_id, // ID của destination để auto-populate name
      location_id,    // ID của location để auto-populate name
      ...tourData
    } = req.body;

    // Tìm tour
    const tour = await Tour.findByPk(id, {
      include: [
        {
          model: Agency,
          as: 'agency',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });
    
    if (!tour) {
      return res.status(404).json({ 
        success: false,
        message: "Tour không tồn tại" 
      });
    }

    // 🌍 AUTO-POPULATE destination và location names từ IDs (cho ADMIN UPDATE)
    if (destination_id) {
      console.log("🎯 Admin Update: Auto-populating destination name from ID:", destination_id);
      const { Destination } = require("../models");
      const destination = await Destination.findByPk(destination_id);
      if (destination) {
        tourData.destination = destination.name;
        console.log("✅ Admin Update: Destination name set to:", destination.name);
      } else {
        return res.status(400).json({
          success: false,
          message: "Destination ID không tồn tại",
          destination_id: destination_id
        });
      }
    }

    if (location_id) {
      console.log("📍 Admin Update: Auto-populating location name from ID:", location_id);
      const { Location } = require("../models");
      const location = await Location.findByPk(location_id);
      if (location) {
        tourData.location = location.name;
        console.log("✅ Admin Update: Location name set to:", location.name);
      } else {
        return res.status(400).json({
          success: false,
          message: "Location ID không tồn tại",
          location_id: location_id
        });
      }
    }

    console.log("🎯 Admin updating core tour data:", tourData);

    // Update core tour data
    await tour.update(tourData);
    console.log("✅ Core tour data updated by admin");

    // Cập nhật images nếu có
    if (images && Array.isArray(images)) {
      console.log("📷 Admin updating images");
      await require("../models").TourImage.destroy({ where: { tour_id: tour.id } });
      for (const img of images) {
        await require("../models").TourImage.create({ ...img, tour_id: tour.id });
      }
    }

    // Cập nhật ngày khởi hành nếu có
    if (departureDates && Array.isArray(departureDates)) {
      console.log("📅 Admin updating departure dates");
      await require("../models").DepartureDate.destroy({ where: { tour_id: tour.id } });
      for (const date of departureDates) {
        await require("../models").DepartureDate.create({ ...date, tour_id: tour.id });
      }
    }

    // Xử lý included services
    const servicesToUpdate = [...selectedIncludedServices, ...included_service_ids].filter(Boolean);
    if (servicesToUpdate.length > 0) {
      console.log("🔧 Admin updating included services:", servicesToUpdate);
      const existingServices = await require("../models").IncludedService.findAll({
        where: { id: servicesToUpdate }
      });
      
      if (existingServices.length > 0) {
        await tour.setIncludedServices(existingServices.map(s => s.id));
        console.log("✅ Included services updated by admin");
      }
    } else if (servicesToUpdate.length === 0) {
      // Clear nếu gửi mảng rỗng
      await tour.setIncludedServices([]);
      console.log("🗑️ Included services cleared by admin");
    }

    // Xử lý categories
    const categoriesToUpdate = [...selectedCategories, ...category_ids].filter(Boolean);
    if (categoriesToUpdate.length > 0) {
      console.log("📂 Admin updating categories:", categoriesToUpdate);
      const existingCategories = await require("../models").TourCategory.findAll({
        where: { id: categoriesToUpdate }
      });
      
      if (existingCategories.length > 0) {
        await tour.setCategories(existingCategories.map(c => c.id));
        console.log("✅ Categories updated by admin");
      }
    } else if (categoriesToUpdate.length === 0) {
      // Clear nếu gửi mảng rỗng
      await tour.setCategories([]);
      console.log("🗑️ Categories cleared by admin");
    }

    // Xử lý hotels
    if (hotel_ids.length > 0) {
      console.log("🏨 Admin updating hotels:", hotel_ids);
      const existingHotels = await require("../models").Hotel.findAll({
        where: { id: hotel_ids }
      });
      
      if (existingHotels.length > 0) {
        await tour.setHotels(existingHotels.map(h => h.id));
        console.log("✅ Hotels updated by admin");
      }
    } else if (hotel_ids.length === 0) {
      // Clear nếu gửi mảng rỗng
      await tour.setHotels([]);
      console.log("🗑️ Hotels cleared by admin");
    }

    // 🚫 Xử lý excluded services - THÊM MỚI
    const excludedServicesToUpdate = (req.body.excluded_service_ids || []).filter(Boolean);
    console.log("🚫 ==================== ADMIN EXCLUDED SERVICES DEBUG ====================");
    console.log("🚫 Raw excluded_service_ids from req.body:", req.body.excluded_service_ids);
    console.log("🚫 excludedServicesToUpdate:", excludedServicesToUpdate, "length:", excludedServicesToUpdate.length);
    console.log("🚫 ================================================================");
    
    if (excludedServicesToUpdate.length > 0) {
      console.log("🚫 Admin updating excluded services:", excludedServicesToUpdate);
      const existingExcludedServices = await require("../models").ExcludedService.findAll({
        where: { id: excludedServicesToUpdate }
      });
      console.log('✅ Found existing excluded services:', existingExcludedServices.map(s => s.id));
      
      if (existingExcludedServices.length > 0) {
        console.log("🔄 About to call tour.setExcludedServices with IDs:", existingExcludedServices.map(s => s.id));
        await tour.setExcludedServices(existingExcludedServices.map(s => s.id));
        console.log("🔄 setExcludedServices completed successfully");
        
        // Kiểm tra lại database ngay sau khi set
        const { sequelize } = require('../models');
        const [checkResult] = await sequelize.query(
          'SELECT * FROM tour_excluded_service WHERE tour_id = ?',
          { replacements: [tour.id], type: sequelize.QueryTypes.SELECT }
        );
        console.log("🔍 Database check after setExcludedServices:", checkResult.length, "records found");
        console.log("✅ Excluded services updated by admin");
      }
    } else if (excludedServicesToUpdate.length === 0) {
      // Clear nếu gửi mảng rỗng
      await tour.setExcludedServices([]);
      console.log("🗑️ Excluded services cleared by admin");
    }

    // Reload tour với tất cả relationships
    const updatedTour = await Tour.findByPk(tour.id, {
      include: [
        {
          model: require("../models").DepartureDate,
          as: 'departureDates',
          attributes: ['id', 'departure_date', 'end_date', 'number_of_days', 'number_of_nights']
        },
        {
          model: require("../models").TourImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main']
        },
        {
          model: require("../models").IncludedService,
          as: 'includedServices',
          attributes: ['id', 'name']
        },
        {
          model: require("../models").ExcludedService,
          as: 'excludedServices',
          attributes: ['id', 'service_name']
        },
        {
          model: require("../models").TourCategory,
          as: 'categories',
          attributes: ['id', 'name']
        },
        // Skip hotels for now due to field mapping issue
        {
          model: Agency,
          as: 'agency',
          attributes: ['id', 'name'],
          include: [{ model: User, as: 'user', attributes: ['email'] }]
        }
      ]
    });

    console.log("🎉 Admin tour update completed successfully:", {
      id: tour.id,
      name: tour.name,
      updatedBy: req.user.email
    });

    // Gửi email thông báo cho agency
    if (tour.agency && tour.agency.user && tour.agency.user.email) {
      try {
        await mailer.sendMail({
          to: tour.agency.user.email,
          subject: `📝 Tour "${tour.name}" đã được admin cập nhật`,
          html: `
            <h2>📝 Tour của bạn đã được admin cập nhật</h2>
            <p><strong>Tour:</strong> ${tour.name}</p>
            <p><strong>Thời gian cập nhật:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            <p><strong>Cập nhật bởi:</strong> Admin (${req.user.email})</p>
            <hr>
            <p>Vui lòng kiểm tra lại thông tin tour để đảm bảo mọi thứ chính xác.</p>
          `
        });
        console.log(`📧 Tour update email sent to ${tour.agency.user.email}`);
      } catch (emailErr) {
        console.error("❌ Failed to send tour update email:", emailErr);
      }
    }

    // Đảm bảo luôn có trường excludedServices (mảng rỗng nếu không có)
    const tourJson = updatedTour.toJSON();
    if (!tourJson.excludedServices) tourJson.excludedServices = [];

    res.json({
      success: true,
      message: `Tour "${tour.name}" đã được admin cập nhật thành công`,
      data: tourJson
    });
    
  } catch (err) {
    console.error("❌ Error in admin updateTour:", err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi admin cập nhật tour', 
      error: err.message 
    });
  }
};

// 🗑️ Admin - Xóa tour (có điều kiện)
const deleteTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // ?force=true để force delete
    
    console.log(`🗑️ Admin attempting to delete tour ${id}, force: ${force}`);
    
    // Tìm tour
    const tour = await Tour.findByPk(id, {
      include: [
        {
          model: Agency,
          as: 'agency',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });
    
    if (!tour) {
      return res.status(404).json({ success: false, message: "Tour không tồn tại" });
    }
    
    // Kiểm tra điều kiện xóa (có thể thêm check booking sau này)
    // const hasBookings = await Booking.count({ where: { tour_id: id } });
    // if (hasBookings > 0 && force !== 'true') {
    //   return res.status(400).json({ 
    //     success: false,
    //     message: "Không thể xóa tour đã có booking. Sử dụng ?force=true để force delete" 
    //   });
    // }
    
    const tourName = tour.name;
    
    // Xóa tour (cascade sẽ xóa các bảng liên quan)
    await tour.destroy();
    
    console.log(`🗑️ Tour ${id} deleted successfully`);
    
    res.json({
      success: true,
      message: `Tour "${tourName}" đã được xóa thành công`,
      data: {
        id,
        name: tourName,
        deletedAt: new Date().toISOString(),
        deletedBy: req.user.email
      }
    });
  } catch (err) {
    console.error("❌ Error in deleteTour:", err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xóa tour', 
      error: err.message 
    });
  }
};

// 🔄 Admin - Bulk cập nhật trạng thái
const bulkUpdateStatus = async (req, res) => {
  try {
    const { tour_ids, status, reason } = req.body;
    
    if (!tour_ids || !Array.isArray(tour_ids) || tour_ids.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Danh sách tour_ids không hợp lệ" 
      });
    }
    
    const validStatuses = ['Chờ duyệt', 'Đang hoạt động', 'Ngừng hoạt động', 'Đã hủy'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Trạng thái không hợp lệ",
        validStatuses 
      });
    }
    
    console.log(`🔄 Admin bulk updating ${tour_ids.length} tours to status: ${status}`);
    
    // Cập nhật bulk
    const [updatedCount] = await Tour.update(
      { status },
      { 
        where: { id: tour_ids },
        returning: true
      }
    );
    
    console.log(`🔄 Bulk updated ${updatedCount} tours`);
    
    res.json({
      success: true,
      message: `Đã cập nhật trạng thái cho ${updatedCount} tours`,
      data: {
        updatedCount,
        tour_ids,
        newStatus: status,
        reason,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.email
      }
    });
  } catch (err) {
    console.error("❌ Error in bulkUpdateStatus:", err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi cập nhật bulk trạng thái', 
      error: err.message 
    });
  }
};

// ➕ Admin - Tạo tour mới cho agency
const createTour = async (req, res) => {
  try {
    const { agency_id, ...requestBody } = req.body;
    
    console.log("📝 Admin creating tour with data:", JSON.stringify(req.body, null, 2));
    
    // Validate required agency_id
    if (!agency_id) {
      return res.status(400).json({
        success: false,
        message: "Cần chọn agency để tạo tour"
      });
    }
    
    // Validate agency exists and is approved
    const agency = await Agency.findByPk(agency_id, {
      include: [{ model: User, as: 'user' }]
    });
    
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency không tồn tại"
      });
    }
    
    if (agency.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: "Agency chưa được duyệt, không thể tạo tour"
      });
    }
    
    console.log(`🏢 Creating tour for agency: ${agency.name} (${agency_id})`);
    
    // Destructure data giống agency create
    const {
      hotel_ids = [],
      category_ids = [],
      included_service_ids = [],
      selectedIncludedServices = [],
      selectedCategories = [],
      images = [],
      departureDates = [],
      destination_id, // ID của destination để auto-populate name
      location_id,    // ID của location để auto-populate name
      ...tourData
    } = requestBody;
    
    // 🌍 AUTO-POPULATE destination và location names từ IDs
    if (destination_id) {
      console.log("🎯 Admin: Auto-populating destination name from ID:", destination_id);
      const { Destination } = require("../models");
      const destination = await Destination.findByPk(destination_id);
      if (destination) {
        tourData.destination = destination.name;
        console.log("✅ Admin: Destination name set to:", destination.name);
      } else {
        return res.status(400).json({
          success: false,
          message: "Destination ID không tồn tại",
          destination_id: destination_id
        });
      }
    }

    if (location_id) {
      console.log("📍 Admin: Auto-populating location name from ID:", location_id);
      const { Location } = require("../models");
      const location = await Location.findByPk(location_id);
      if (location) {
        tourData.location = location.name;
        console.log("✅ Admin: Location name set to:", location.name);
      } else {
        return res.status(400).json({
          success: false,
          message: "Location ID không tồn tại",
          location_id: location_id
        });
      }
    }
    
    // Gán agency_id
    tourData.agency_id = agency_id;
    
    console.log("🎯 Core tour data:", tourData);
    
    // Tạo tour với core data
    const tour = await Tour.create(tourData);
    console.log("✅ Tour created with ID:", tour.id);
    
    // Thêm images
    if (images && images.length > 0) {
      console.log("📷 Adding", images.length, "images");
      for (const img of images) {
        await require("../models").TourImage.create({ ...img, tour_id: tour.id });
      }
    }
    
    // Thêm ngày khởi hành
    if (departureDates && departureDates.length > 0) {
      console.log("📅 Adding", departureDates.length, "departure dates");
      for (const date of departureDates) {
        await require("../models").DepartureDate.create({ ...date, tour_id: tour.id });
      }
    }
    
    // Xử lý included services
    const servicesToAdd = [...selectedIncludedServices, ...included_service_ids].filter(Boolean);
    if (servicesToAdd.length > 0) {
      console.log("🔧 Adding included services:", servicesToAdd);
      const existingServices = await require("../models").IncludedService.findAll({
        where: { id: servicesToAdd }
      });
      
      if (existingServices.length > 0) {
        await tour.setIncludedServices(existingServices.map(s => s.id));
        console.log("✅ Included services added");
      }
    }
    
    // Xử lý categories
    const categoriesToAdd = [...selectedCategories, ...category_ids].filter(Boolean);
    if (categoriesToAdd.length > 0) {
      console.log("📂 Adding categories:", categoriesToAdd);
      const existingCategories = await require("../models").TourCategory.findAll({
        where: { id: categoriesToAdd }
      });
      
      if (existingCategories.length > 0) {
        await tour.setCategories(existingCategories.map(c => c.id));
        console.log("✅ Categories added");
      }
    }

    // 🚫 Xử lý excluded services - THÊM MỚI CHO CREATE
    const excludedServicesToAdd = (requestBody.excluded_service_ids || []).filter(Boolean);
    console.log("🚫 ==================== ADMIN CREATE EXCLUDED SERVICES DEBUG ====================");
    console.log("🚫 Raw excluded_service_ids from requestBody:", requestBody.excluded_service_ids);
    console.log("🚫 excludedServicesToAdd:", excludedServicesToAdd, "length:", excludedServicesToAdd.length);
    console.log("🚫 ========================================================================");
    
    if (excludedServicesToAdd.length > 0) {
      console.log("🚫 Admin creating tour with excluded services:", excludedServicesToAdd);
      const existingExcludedServices = await require("../models").ExcludedService.findAll({
        where: { id: excludedServicesToAdd }
      });
      console.log('✅ Found existing excluded services:', existingExcludedServices.map(s => s.id));
      
      if (existingExcludedServices.length > 0) {
        console.log("🔄 About to call tour.setExcludedServices with IDs:", existingExcludedServices.map(s => s.id));
        await tour.setExcludedServices(existingExcludedServices.map(s => s.id));
        console.log("🔄 setExcludedServices completed successfully for CREATE");
        
        // Kiểm tra lại database ngay sau khi set
        const { sequelize } = require('../models');
        const [checkResult] = await sequelize.query(
          'SELECT * FROM tour_excluded_service WHERE tour_id = ?',
          { replacements: [tour.id], type: sequelize.QueryTypes.SELECT }
        );
        console.log("🔍 Database check after CREATE setExcludedServices:", checkResult.length, "records found");
        console.log("✅ Excluded services added in CREATE by admin");
      }
    }

    // Xử lý hotels
    if (hotel_ids.length > 0) {
      console.log("🏨 Adding hotels:", hotel_ids);
      const existingHotels = await require("../models").Hotel.findAll({
        where: { id_hotel: hotel_ids }
      });
      
      if (existingHotels.length > 0) {
        await tour.setHotels(existingHotels.map(h => h.id_hotel));
        console.log("✅ Hotels added");
      }
    }
    
    // Reload tour với tất cả relationships
    const fullTour = await Tour.findByPk(tour.id, {
      include: [
        {
          model: require("../models").DepartureDate,
          as: 'departureDates',
          attributes: ['id', 'departure_date', 'end_date', 'number_of_days', 'number_of_nights']
        },
        {
          model: require("../models").TourImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main']
        },
        {
          model: require("../models").IncludedService,
          as: 'includedServices',
          attributes: ['id', 'name']
        },
        {
          model: require("../models").ExcludedService,
          as: 'excludedServices',
          attributes: ['id', 'service_name']
        },
        {
          model: require("../models").TourCategory,
          as: 'categories',
          attributes: ['id', 'name']
        },
        {
          model: Agency,
          as: 'agency',
          attributes: ['id', 'name'],
          include: [{ model: User, as: 'user', attributes: ['email'] }]
        }
      ]
    });
    
    console.log("🎉 Admin tour creation completed:", {
      id: tour.id,
      name: tour.name,
      agency: agency.name,
      createdBy: req.user.email
    });
    
    // Gửi email thông báo cho agency
    if (agency.user && agency.user.email) {
      try {
        const mailer = require('../config/mailer');
        await mailer.sendMail({
          to: agency.user.email,
          subject: `🎉 Admin đã tạo tour mới "${tour.name}" cho agency của bạn`,
          html: `
            <h2>🎉 Tour mới đã được tạo bởi Admin</h2>
            <p><strong>Tour:</strong> ${tour.name}</p>
            <p><strong>Giá:</strong> ${tour.price?.toLocaleString('vi-VN')} VNĐ</p>
            <p><strong>Địa điểm:</strong> ${tour.location}</p>
            <p><strong>Điểm đến:</strong> ${tour.destination}</p>
            <p><strong>Trạng thái:</strong> ${tour.status}</p>
            <p><strong>Được tạo bởi:</strong> Admin (${req.user.email})</p>
            <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            <p><em>Bạn có thể đăng nhập vào hệ thống để xem chi tiết và chỉnh sửa tour.</em></p>
          `
        });
        console.log("📧 Email notification sent to agency");
      } catch (emailError) {
        console.error("📧 Email notification failed:", emailError);
        // Không throw error vì tour đã tạo thành công
      }
    }
    
    // Đảm bảo luôn có trường excludedServices (mảng rỗng nếu không có)
    const tourJson = fullTour.toJSON();
    if (!tourJson.excludedServices) tourJson.excludedServices = [];
    
    res.status(201).json({
      success: true,
      message: `Tour "${tour.name}" đã được tạo thành công cho agency "${agency.name}"`,
      data: {
        tour: tourJson,
        createdBy: req.user.email,
        createdAt: new Date().toISOString()
      }
    });
    
  } catch (err) {
    console.error("❌ Error in admin createTour:", err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo tour',
      error: err.message
    });
  }
};

module.exports = {
  getAllTours,
  getTour,
  getTourStats,
  approveTour,
  rejectTour,
  updateTourStatus,
  updateTour,
  deleteTour,
  bulkUpdateStatus,
  createTour
};
