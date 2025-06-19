const express = require("express");
const router = express.Router();
const holidayController = require("../controllers/holidayController");
const authenticateToken = require("../middlewares/authMiddleware");

// 공휴일 조회 (인증 불필요 - 공개 정보)
router.get("/", holidayController.getHolidays);
router.get("/month", holidayController.getHolidaysByMonth);

module.exports = router; 