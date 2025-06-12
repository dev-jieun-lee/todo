// routes/approvalRoutes.js
const express = require("express");
const router = express.Router();
const approvalController = require("../controllers/approvalController");
const authenticateToken = require("../middlewares/authMiddleware");

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
  "/get-myApproval-documents",
  authenticateToken,
  approvalController.getMyApprovalDocuments
);

// 결재자 직급 정보 조회
router.get(
  "/position-label/:targetId",
  authenticateToken,
  approvalController.getPositionLabel
);

//상세보기
router.get(
  "/:targetType/:targetId/detail",
  approvalController.getApprovalDetail
);

// approval_lines 조회 API 추가 (approvalController에서 getApprovalLines를 호출)
router.get(
  "/approval-lines",
  authenticateToken,
  approvalController.getApprovalLines
);
module.exports = router;
