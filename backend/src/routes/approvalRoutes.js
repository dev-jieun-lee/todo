// routes/approvalRoutes.js
const express = require("express");
const router = express.Router();
const approvalController = require("../controllers/approvalController");
const authenticateToken = require("../middlewares/authMiddleware");

// 승인 / 반려
router.post(
  "/:targetType/:targetId/approve",
  authenticateToken,
  approvalController.approve
);
router.post(
  "/:targetType/:targetId/reject",
  authenticateToken,
  approvalController.reject
);

// 승인 이력
router.get(
  "/:targetType/:targetId/history",
  authenticateToken,
  approvalController.getApprovalHistory
);

// 내가 요청한 항목
router.get(
  "/requested-by-me",
  authenticateToken,
  approvalController.getRequestedApprovals
);

// 내가 승인할 항목
router.get(
  "/pending-to-me",
  authenticateToken,
  approvalController.getPendingToMe
);

// 결재자 직급 정보 조회
router.get(
  "/position-label/:targetId",
  authenticateToken,
  approvalController.getPositionLabel
);

module.exports = router;
