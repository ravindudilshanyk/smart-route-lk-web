const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");

router.get("/availability", async (req, res) => {
  const { bus_id, travel_date, board_stop_order, drop_stop_order } = req.query;

  if (!bus_id || !travel_date || !board_stop_order || !drop_stop_order) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const seatsRes = await pool.query(
      `SELECT s.id, s.seat_number, s.row_index, s.col_index
       FROM seats s
       JOIN seat_layouts sl ON sl.id = s.layout_id
       WHERE sl.bus_id = $1 AND s.is_active = true
       ORDER BY s.row_index, s.col_index`,
      [bus_id],
    );

    const availRes = await pool.query(
      `SELECT
         sa.seat_id,
         sa.board_stop_order,
         sa.drop_stop_order,
         bs1.stop_name AS taken_from_stop,
         bs2.stop_name AS taken_to_stop
       FROM seat_availability sa
       JOIN bus_stops bs1 ON bs1.bus_id = $1 AND bs1.stop_order = sa.board_stop_order
       JOIN bus_stops bs2 ON bs2.bus_id = $1 AND bs2.stop_order = sa.drop_stop_order
       WHERE sa.travel_date = $2
         AND sa.seat_id IN (
           SELECT s.id FROM seats s
           JOIN seat_layouts sl ON sl.id = s.layout_id
           WHERE sl.bus_id = $1
         )`,
      [bus_id, travel_date],
    );

    const board = parseInt(board_stop_order);
    const drop = parseInt(drop_stop_order);

    const availability = {};

    seatsRes.rows.forEach((seat) => {
      const bookings = availRes.rows.filter((a) => a.seat_id === seat.id);

      // FULLY conflicting — booking completely covers your segment
      // (boards at or before you AND drops at or after you)
      const fullyConflicting = bookings.filter((a) => {
        const aBoard = parseInt(a.board_stop_order);
        const aDrop = parseInt(a.drop_stop_order);
        return aBoard <= board && aDrop >= drop;
      });

      // PARTIALLY conflicting — overlaps but starts AFTER your board stop
      // Seat is FREE from your board until that booking starts → show YELLOW
      const partiallyConflicting = bookings.filter((a) => {
        const aBoard = parseInt(a.board_stop_order);
        const aDrop = parseInt(a.drop_stop_order);
        const overlaps = aBoard < drop && aDrop > board;
        const startsAfterYouBoard = aBoard > board;
        return overlaps && startsAfterYouBoard;
      });

      // Non-overlapping — booking on a completely different segment → YELLOW
      const nonOverlapping = bookings.filter((a) => {
        const aBoard = parseInt(a.board_stop_order);
        const aDrop = parseInt(a.drop_stop_order);
        return !(aBoard < drop && aDrop > board);
      });

      if (fullyConflicting.length > 0) {
        // Seat fully taken — RED
        availability[seat.id] = {
          fully_booked: true,
          partially_booked: false,
          taken_from: fullyConflicting[0].taken_from_stop,
          taken_to: fullyConflicting[0].taken_to_stop,
        };
      } else if (partiallyConflicting.length > 0) {
        // Seat free at start, taken later — YELLOW
        availability[seat.id] = {
          fully_booked: false,
          partially_booked: true,
          taken_from: partiallyConflicting[0].taken_from_stop,
          taken_to: partiallyConflicting[0].taken_to_stop,
          taken_board_order: parseInt(partiallyConflicting[0].board_stop_order),
        };
      } else if (nonOverlapping.length > 0) {
        // Seat booked on different segment — YELLOW
        availability[seat.id] = {
          fully_booked: false,
          partially_booked: true,
          taken_from: nonOverlapping[0].taken_from_stop,
          taken_to: nonOverlapping[0].taken_to_stop,
          taken_board_order: parseInt(nonOverlapping[0].board_stop_order),
        };
      }
      // available seats not added to availability object
    });

    res.json({ availability, seats: seatsRes.rows });
  } catch (err) {
    console.error("Seat availability error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
