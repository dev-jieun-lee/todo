const express = require("express");
const router = express.Router();

const vacationController = require("../controllers/vacationController");
const authenticateToken = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");

// 사용자 전용 API
router.post("/apply", authenticateToken, vacationController.applyVacation);
router.get("/my", authenticateToken, vacationController.getMyVacations);
router.post(
  "/cancel/:id",
  authenticateToken,
  vacationController.cancelVacation
);

// 관리자 전용 API
router.post(
  "/approve/:id",
  authenticateToken,
  requireAdmin,
  vacationController.approveVacation
);
router.post(
  "/reject/:id",
  authenticateToken,
  requireAdmin,
  vacationController.rejectVacation
);
router.get(
  "/all",
  authenticateToken,
  requireAdmin,
  vacationController.getAllVacationRequests
);

module.exports = router;
