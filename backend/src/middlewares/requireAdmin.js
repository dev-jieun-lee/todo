const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "관리자 권한이 필요합니다." });
  }
  next();
};

module.exports = requireAdmin;
