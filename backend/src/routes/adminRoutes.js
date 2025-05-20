const express = require("express");
const router = express.Router();
const { forceLogout } = require("../controllers/adminController");
const authenticateToken = require("../middlewares/authMiddleware");

router.post("/force-logout", authenticateToken, forceLogout);

module.exports = router;
