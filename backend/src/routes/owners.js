const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const {
  applyOwner,
  getOwnerProfile,
  uploadDocs,
} = require("../controllers/ownerController");

// Apply to become owner — any logged in passenger can apply
router.post("/apply", authMiddleware, uploadDocs, applyOwner);

// Get own owner profile — only owners
router.get(
  "/profile",
  authMiddleware,
  requireRole("owner", "admin"),
  getOwnerProfile,
);

module.exports = router;
