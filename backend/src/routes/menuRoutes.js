const express = require("express");
const router = express.Router();
const { getMenus } = require("../controllers/menuController");
const authenticateToken = require("../middlewares/authMiddleware");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");

router.get(
  "/",
  authenticateToken,
  (req, res, next) => {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ,
      `GET /api/menus 요청 도착 - 사용자: ${req.user?.username}`,
      "info"
    );
    next();
  },
  getMenus
);

module.exports = router;
