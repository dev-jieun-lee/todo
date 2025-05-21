const express = require("express");
const router = express.Router();
const { getMenus } = require("../controllers/menuController");
const authenticateToken = require("../middlewares/authMiddleware");

router.get(
  "/",
  authenticateToken,
  (req, res, next) => {
    console.log("📥 GET /api/menus 요청 도착 - 사용자:", req.user?.username);
    next();
  },
  getMenus
);

module.exports = router;
