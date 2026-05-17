const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const {
  addBus,
  getMyBuses,
  getBusById,
} = require("../controllers/busController");

// All routes require login
router.use(authMiddleware);

// Owner only
router.post("/", requireRole("owner", "admin"), addBus);
router.get("/mine", requireRole("owner", "admin"), getMyBuses);

// Anyone logged in can view a bus (needed for booking)
router.get("/:id", getBusById);

module.exports = router;
