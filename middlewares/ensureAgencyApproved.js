const { User } = require("../models");

module.exports = async (req, res, next) => {
  console.log('[ensureAgencyApproved] Middleware called, req.user:', req.user);
  
  try {
    if (req.user?.role !== "agency") {
      console.log('[ensureAgencyApproved] User role is not agency:', req.user?.role);
      return res.status(403).json({ message: "Chỉ agency đã được duyệt mới có quyền thao tác" });
    }
    
    // Lấy user từ DB để kiểm tra status
    const user = await User.findByPk(req.user.id);
    console.log('[ensureAgencyApproved] User from DB:', user ? { id: user.id, status: user.status } : 'null');
    
    if (!user || user.status !== "active") {
      console.log('[ensureAgencyApproved] User not found or not active. Status:', user?.status);
      return res.status(403).json({ message: "Chỉ agency đã được duyệt mới có quyền thao tác" });
    }
    
    console.log('[ensureAgencyApproved] Middleware passed, calling next()');
    next();
  } catch (err) {
    console.error("[ensureAgencyApproved] Error:", err);
    return res.status(500).json({ message: "Lỗi xác thực agency" });
  }
};
