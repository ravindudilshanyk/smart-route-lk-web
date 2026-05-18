const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const { googleAuth } = require('../controllers/googleAuthController');

// Public routes — no token needed
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);

// Protected route — token required
router.get("/me", authMiddleware, getMe);

module.exports = router;
