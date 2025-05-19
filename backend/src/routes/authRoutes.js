const express = require("express");
const router = express.Router();
const { login, logout } = require("../controllers/authController");
const authenticateToken = require("../middlewares/authMiddleware");

// 로그인
router.post("/login", login);

// 로그인한 사용자 정보 확인
router.get("/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

//로그아웃
router.post("/logout", authenticateToken, logout);

module.exports = router;
