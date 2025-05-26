const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticateToken = require("../middlewares/authMiddleware");

router.get("/approvers", authenticateToken, userController.getApprovers);

module.exports = router;
