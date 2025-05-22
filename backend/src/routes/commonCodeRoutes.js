const express = require("express");
const router = express.Router();
const { getCodesByGroup } = require("../controllers/commonCodeController");
const authenticateToken = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, getCodesByGroup);

module.exports = router;
