const { FAQ } = require("../models");
const { Op } = require("sequelize");

// ═══════════════════════════════════════════════════════════════════
// 🤖 FAQ CHAT SYSTEM - For Website Widget
// ═══════════════════════════════════════════════════════════════════

// GET /api/faqs/chat - Lấy FAQs cho chat widget
const getChatFAQs = async (req, res) => {
  try {
    const { category, limit = 10, search } = req.query;
    
    let whereClause = { is_active: true };
    
    // Filter by category
    if (category) {
      whereClause.category = category;
    }
    
    // Search in questions and keywords
    if (search) {
      whereClause[Op.or] = [
        { question: { [Op.iLike]: `%${search}%` } },
        { answer: { [Op.iLike]: `%${search}%` } },
        { keywords: { [Op.contains]: [search.toLowerCase()] } }
      ];
    }
    
    const faqs = await FAQ.findAll({
      where: whereClause,
      order: [
        ['order_priority', 'DESC'], // Ưu tiên theo order_priority
        ['view_count', 'DESC'],     // Sau đó theo popularity
        ['created_at', 'DESC']      // Cuối cùng theo thời gian
      ],
      limit: parseInt(limit),
      attributes: ['id', 'question', 'answer', 'category', 'view_count']
    });
    
    res.json({
      success: true,
      message: "Lấy FAQ chat thành công",
      data: faqs,
      total: faqs.length
    });
  } catch (error) {
    console.error("❌ Error getting chat FAQs:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy FAQ chat",
      error: error.message
    });
  }
};

// GET /api/faqs/chat/categories - Lấy danh sách categories
const getChatCategories = async (req, res) => {
  try {
    const categories = await FAQ.findAll({
      where: { 
        is_active: true,
        category: { [Op.not]: null }
      },
      attributes: ['category'],
      group: ['category'],
      raw: true
    });
    
    const categoryList = categories.map(c => c.category);
    
    res.json({
      success: true,
      data: categoryList
    });
  } catch (error) {
    console.error("❌ Error getting FAQ categories:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh mục FAQ",
      error: error.message
    });
  }
};

// POST /api/faqs/chat/search - Smart search FAQ
const searchFAQs = async (req, res) => {
  try {
    const { query, category } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập từ khóa tìm kiếm"
      });
    }
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    let whereClause = { is_active: true };
    
    if (category) {
      whereClause.category = category;
    }
    
    // Advanced search with multiple conditions
    const searchConditions = [];
    
    searchTerms.forEach(term => {
      searchConditions.push(
        { question: { [Op.iLike]: `%${term}%` } },
        { answer: { [Op.iLike]: `%${term}%` } },
        { keywords: { [Op.contains]: [term] } }
      );
    });
    
    whereClause[Op.and] = [
      {
        [Op.or]: searchConditions
      }
    ];
    
    const faqs = await FAQ.findAll({
      where: whereClause,
      order: [
        ['order_priority', 'DESC'],
        ['view_count', 'DESC']
      ],
      limit: 10,
      attributes: ['id', 'question', 'answer', 'category']
    });
    
    res.json({
      success: true,
      message: `Tìm thấy ${faqs.length} FAQ phù hợp`,
      data: faqs,
      query: query
    });
  } catch (error) {
    console.error("❌ Error searching FAQs:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm FAQ",
      error: error.message
    });
  }
};

// PUT /api/faqs/:id/view - Tăng view count khi user click FAQ
const incrementViewCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    const faq = await FAQ.findByPk(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy FAQ"
      });
    }
    
    await faq.increment('view_count');
    
    res.json({
      success: true,
      message: "Đã cập nhật view count",
      view_count: faq.view_count + 1
    });
  } catch (error) {
    console.error("❌ Error incrementing view count:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật view count",
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════
// 🛠️ ADMIN FAQ MANAGEMENT - Existing CRUD
// ═══════════════════════════════════════════════════════════════════

// GET /api/faqs - Admin get all FAQs
const getAll = async (req, res) => {
  try {
    const { category, is_active, page = 1, limit = 20 } = req.query;
    
    let whereClause = {};
    if (category) whereClause.category = category;
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await FAQ.findAndCountAll({
      where: whereClause,
      order: [['order_priority', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("❌ Error getting all FAQs:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách FAQ",
      error: error.message
    });
  }
};

// GET /api/faqs/:id - Get single FAQ
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByPk(id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy FAQ"
      });
    }
    
    res.json({
      success: true,
      data: faq
    });
  } catch (error) {
    console.error("❌ Error getting FAQ by ID:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy FAQ",
      error: error.message
    });
  }
};

// POST /api/faqs - Create new FAQ
const create = async (req, res) => {
  try {
    const { question, answer, category, keywords, order_priority, is_active } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Question và Answer là bắt buộc"
      });
    }
    
    const faq = await FAQ.create({
      question: question.trim(),
      answer: answer.trim(),
      category: category || 'general',
      keywords: Array.isArray(keywords) ? keywords : [],
      order_priority: order_priority || 0,
      is_active: is_active !== undefined ? is_active : true
    });
    
    res.status(201).json({
      success: true,
      message: "Tạo FAQ thành công",
      data: faq
    });
  } catch (error) {
    console.error("❌ Error creating FAQ:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo FAQ",
      error: error.message
    });
  }
};

// PUT /api/faqs/:id - Update FAQ
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, keywords, order_priority, is_active } = req.body;
    
    const faq = await FAQ.findByPk(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy FAQ"
      });
    }
    
    const updateData = {};
    if (question) updateData.question = question.trim();
    if (answer) updateData.answer = answer.trim();
    if (category !== undefined) updateData.category = category;
    if (keywords !== undefined) updateData.keywords = Array.isArray(keywords) ? keywords : [];
    if (order_priority !== undefined) updateData.order_priority = order_priority;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    await faq.update(updateData);
    
    res.json({
      success: true,
      message: "Cập nhật FAQ thành công",
      data: faq
    });
  } catch (error) {
    console.error("❌ Error updating FAQ:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật FAQ",
      error: error.message
    });
  }
};

// DELETE /api/faqs/:id - Delete FAQ
const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    
    const faq = await FAQ.findByPk(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy FAQ"
      });
    }
    
    await faq.destroy();
    
    res.json({
      success: true,
      message: "Xóa FAQ thành công"
    });
  } catch (error) {
    console.error("❌ Error deleting FAQ:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa FAQ",
      error: error.message
    });
  }
};

module.exports = {
  // 🤖 Chat Functions
  getChatFAQs,
  getChatCategories, 
  searchFAQs,
  incrementViewCount,
  
  // 🛠️ Admin CRUD Functions
  getAll,
  getById,
  create,
  update,
  delete: deleteFAQ
};
