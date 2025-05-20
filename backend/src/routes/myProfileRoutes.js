const express = require("express");
const router = express.Router();
const { getMyProfile } = require("../controllers/myProfileController");
const authenticateToken = require("../middlewares/authMiddleware");

router.get("/my-profile-details", authenticateToken, getMyProfile);

module.exports = router;
