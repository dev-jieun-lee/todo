const express = require("express");
const router = express.Router();

const {
  forceLogout,
  getActiveSessions,
} = require("../controllers/adminController");

const authenticateToken = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");

// 사용자 전체 세션 조회
router.get("/sessions", authenticateToken, requireAdmin, getActiveSessions);

// 특정 사용자 전체 세션 삭제 (강제 로그아웃)
router.post("/force-logout", authenticateToken, requireAdmin, forceLogout);

module.exports = router;
