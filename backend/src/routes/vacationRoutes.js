const express = require("express");
const router = express.Router();
const {
  applyVacation,
  getMyVacations,
  cancelVacation,
} = require("../controllers/vacationController");
const authenticateToken = require("../middlewares/authMiddleware");

router.post("/apply", authenticateToken, applyVacation);
router.get("/my", authenticateToken, getMyVacations);
router.post("/cancel/:id", authenticateToken, cancelVacation);

module.exports = router;
