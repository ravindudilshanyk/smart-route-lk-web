const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");

// Get seat availability for a bus on a specific date and segment
router.get("/availability", async (req, res) => {
  const { bus_id, travel_date, board_stop_order, drop_stop_order } = req.query;

  if (!bus_id || !travel_date) {
    return res.status(400).json({ error: "bus_id and travel_date required." });
  }

  try {
    // Get all active seats for this bus
    const seatsResult = await pool.query(
      `SELECT s.id, s.seat_number, s.row_index, s.col_index
       FROM seats s
       JOIN seat_layouts sl ON sl.id = s.layout_id
       WHERE sl.bus_id = $1 AND s.is_active = true`,
      [bus_id],
    );

    const availability = {};

    for (const seat of seatsResult.rows) {
      // Find all bookings for this seat on this date
      const bookings = await pool.query(
        `SELECT sa.board_stop_order, sa.drop_stop_order
         FROM seat_availability sa
         WHERE sa.seat_id = $1 AND sa.travel_date = $2`,
        [seat.id, travel_date],
      );

      if (bookings.rows.length === 0) {
        // Completely free
        availability[seat.id] = {
          fully_booked: false,
          partially_booked: false,
          segments: [],
        };
        continue;
      }

      const bOrder = parseInt(board_stop_order) || 1;
      const dOrder = parseInt(drop_stop_order) || 99;

      // Check if any booking overlaps with passenger's segment
      let fullyBooked = false;
      let partiallyBooked = false;

      for (const booking of bookings.rows) {
        const bStart = booking.board_stop_order;
        const bEnd = booking.drop_stop_order;

        // Overlap check: booking overlaps if bStart < dOrder AND bEnd > bOrder
        const overlaps = bStart < dOrder && bEnd > bOrder;

        if (overlaps) {
          // Full overlap = entire passenger segment blocked
          if (bStart <= bOrder && bEnd >= dOrder) {
            fullyBooked = true;
          } else {
            partiallyBooked = true;
          }
        }
      }

      availability[seat.id] = {
        fully_booked: fullyBooked,
        partially_booked: !fullyBooked && partiallyBooked,
        segments: bookings.rows,
      };
    }

    res.json({ availability });
  } catch (err) {
    console.error("Seat availability error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
