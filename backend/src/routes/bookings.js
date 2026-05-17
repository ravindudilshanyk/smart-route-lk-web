const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} = require("../controllers/bookingController");

// All booking routes require login
router.use(authMiddleware);

router.post("/", createBooking);
router.get("/mine", getMyBookings);
router.get("/:id", getBookingById);
router.patch("/:id/cancel", cancelBooking);

module.exports = router;
