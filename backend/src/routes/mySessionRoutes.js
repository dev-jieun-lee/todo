const express = require("express");
const router = express.Router();
const {
  getMySessions,
  deleteMySession,
  deleteAllExceptCurrent,
} = require("../controllers/mySessionController");
const authenticateToken = require("../middlewares/authMiddleware");

router.use(authenticateToken); // 인증 필요

router.get("/", getMySessions); // 내 세션 전체 조회
router.delete("/:token", deleteMySession); // 특정 세션 삭제
router.delete("/", deleteAllExceptCurrent); // 현재 세션 제외 모두 삭제

module.exports = router;
