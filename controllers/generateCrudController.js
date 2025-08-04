module.exports = (Model, include = []) => {
  // Chuẩn hoá: nếu dev truyền { include: [...] } thì rút gọn về [...]
  const defaultInclude = Array.isArray(include) ? include : include.include || [];

  return {
    async getAll(req, res) {
      try {
        // Lọc theo query param (ví dụ: user_id)
        const where = {};
        if (req.query.user_id) {
          where.user_id = req.query.user_id;
        }
        // Có thể bổ sung các filter khác ở đây
        const rows = await Model.findAll({ where, include: defaultInclude });
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
        // Validate foreign key cho Destination
        if (Model.name === 'Destination' && req.body.location_id) {
          const { Location } = require("../models");
          const location = await Location.findByPk(req.body.location_id);
          if (!location) {
            return res.status(400).json({ 
              error: "Invalid location_id", 
              message: `Location với ID ${req.body.location_id} không tồn tại`
            });
          }
        }

        // 🔐 Special handling for User model - hash password
        let dataToCreate = { ...req.body };
        
        if (Model.name === 'User' && req.body.password) {
          const bcrypt = require('bcrypt');
          console.log('🔐 Hashing password for User creation...');
          
          // Hash password and remove plain password from data
          const salt = await bcrypt.genSalt(10);
          dataToCreate.password_hash = await bcrypt.hash(req.body.password, salt);
          delete dataToCreate.password; // Remove plain password
          
          console.log('✅ Password hashed successfully');
        } else if (Model.name === 'User' && !req.body.password && !req.body.password_hash) {
          return res.status(400).json({ 
            error: "Password is required",
            message: "Vui lòng cung cấp mật khẩu cho user mới"
          });
        }
        
        const row = await Model.create(dataToCreate);
        
        // 📧 Gửi email thông báo khi tạo user có role agency
        if (Model.name === 'User' && dataToCreate.role === 'agency') {
          try {
            console.log(`📧 Sending agency account created email for user: ${dataToCreate.email}`);
            const { sendAgencyAccountCreatedEmail } = require('../services/emailNotificationService');
            
            await sendAgencyAccountCreatedEmail({
              email: dataToCreate.email,
              username: dataToCreate.username || dataToCreate.name,
              tempPassword: req.body.password, // Sử dụng password gốc từ request
              name: dataToCreate.name,
              id: row.id
            });
            console.log(`✅ Agency account created email sent to: ${dataToCreate.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send agency email to ${dataToCreate.email}:`, emailError);
            // Không fail request vì user đã tạo thành công
          }
        }
        
        // Don't return password_hash in response
        if (Model.name === 'User') {
          const { password_hash, ...userResponse } = row.toJSON();
          res.status(201).json(userResponse);
        } else {
          res.status(201).json(row);
        }
      } catch (err) {
        console.error('❌ Create error:', err);
        res.status(500).json({ error: err.message });
      }
    },

    async update(req, res) {
      try {
        // Validate foreign key cho Destination
        if (Model.name === 'Destination' && req.body.location_id) {
          const { Location } = require("../models");
          const location = await Location.findByPk(req.body.location_id);
          if (!location) {
            return res.status(400).json({ 
              error: "Invalid location_id", 
              message: `Location với ID ${req.body.location_id} không tồn tại`
            });
          }
        }
        
        // Lọc ra các trường hợp lệ của model
        const modelAttributes = Object.keys(Model.rawAttributes);
        const validData = {};
        
        for (const key in req.body) {
          if (modelAttributes.includes(key)) {
            validData[key] = req.body[key];
          }
        }
        
        const [count] = await Model.update(validData, { where: { id: req.params.id } });
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
        
        // Xử lý cascade delete cho Location
        if (Model.name === 'Location') {
          const { ItineraryLocation, Destination } = require("../models");
          
          // Xóa itinerary_location records trước
          await ItineraryLocation.destroy({
            where: { location_id: req.params.id }
          });
          
          // Xóa destination records
          await Destination.destroy({
            where: { location_id: req.params.id }
          });
        }
        
        // Xử lý cascade delete cho Destination
        if (Model.name === 'Destination') {
          const { ItineraryLocation } = require("../models");
          
          // Nếu destination có location_id, xóa itinerary_location references
          if (item.location_id) {
            await ItineraryLocation.destroy({
              where: { location_id: item.location_id }
            });
          }
        }
        
        await item.destroy();
        res.json({ message: "Đã xoá thành công" });
      } catch (err) {
        console.error("Lỗi delete:", err);
        res.status(500).json({ message: "Xoá thất bại", error: err.message });
      }
    }
  };
};
