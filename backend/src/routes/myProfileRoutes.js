const express = require("express");
const router = express.Router();
const {
  getMyProfile,
  getLeaveSummary,
} = require("../controllers/myProfileController");
const authenticateToken = require("../middlewares/authMiddleware");

router.get("/my-profile-details", authenticateToken, getMyProfile);
router.get("/leave-summary", authenticateToken, getLeaveSummary);

module.exports = router;
