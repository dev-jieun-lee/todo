const express = require("express");
const router = express.Router();
const { logMenuAccess } = require("../controllers/logController");
const authenticateToken = require("../middlewares/authMiddleware");

router.post("/menu-access", authenticateToken, logMenuAccess);

module.exports = router;
