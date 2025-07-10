module.exports = (req, res, next) => {
  if (req.user?.role !== "agency" || req.user?.status !== "active") {
    return res.status(403).json({ message: "Chỉ agency đã được duyệt mới có quyền thao tác" });
  }
  next();
};
