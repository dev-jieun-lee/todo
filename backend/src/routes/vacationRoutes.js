const express = require("express");
const router = express.Router();
const vacationController = require("../controllers/vacationController");
const authenticateToken = require("../middlewares/authMiddleware");

router.post("/apply", authenticateToken, vacationController.applyVacation);
router.get("/my", authenticateToken, vacationController.getMyVacations);
router.get("/team", authenticateToken, vacationController.getTeamVacations);
router.post(
  "/cancel/:id",
  authenticateToken,
  vacationController.cancelVacation
);

module.exports = router;
