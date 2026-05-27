const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// ── Get today's passengers for conductor's bus ──────
router.get("/today", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  try {
    const conductorRes = await pool.query(
      "SELECT bus_id FROM conductors WHERE user_id = $1",
      [req.user.id],
    );

    if (conductorRes.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No bus assigned to this conductor." });
    }

    const bus_id = conductorRes.rows[0].bus_id;

    const busRes = await pool.query(
      "SELECT id, reg_number, route_name FROM buses WHERE id = $1",
      [bus_id],
    );

    const passRes = await pool.query(
      `SELECT
         bp.passenger_name,
         bp.seat_number,
         bp.boarded,
         bp.boarded_at,
         bp.no_show,
         bp.gender,
         bp.qr_token,
         bs1.stop_name AS board_stop,
         bs2.stop_name AS drop_stop
       FROM booking_passengers bp
       JOIN bookings bk ON bk.id = bp.booking_id
       JOIN bus_stops bs1 ON bs1.id = bk.board_stop_id
       JOIN bus_stops bs2 ON bs2.id = bk.drop_stop_id
       WHERE bk.bus_id = $1
         AND bk.travel_date = $2
         AND bk.booking_status = 'confirmed'
       ORDER BY bp.seat_number`,
      [bus_id, today],
    );

    res.json({
      bus: busRes.rows[0] || null,
      passengers: passRes.rows,
      date: today,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error." });
  }
});

// ── Scan QR and mark passenger as boarded ──────────
router.post("/scan", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token required." });

  try {
    const conductorRes = await pool.query(
      "SELECT bus_id FROM conductors WHERE user_id = $1",
      [req.user.id],
    );

    if (conductorRes.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "No bus assigned to this conductor." });
    }

    const bus_id = conductorRes.rows[0].bus_id;

    // Find passenger by QR token — qr_token is UUID type
    const passengerRes = await pool.query(
      `SELECT
         bp.id,
         bp.passenger_name,
         bp.seat_number,
         bp.boarded,
         bk.bus_id,
         bs1.stop_name AS board_stop,
         bs2.stop_name AS drop_stop
       FROM booking_passengers bp
       JOIN bookings bk ON bk.id = bp.booking_id
       JOIN bus_stops bs1 ON bs1.id = bk.board_stop_id
       JOIN bus_stops bs2 ON bs2.id = bk.drop_stop_id
       WHERE bp.qr_token::text = $1
          OR bp.qr_token::text = $1::text`,
      [token],
    );

    if (passengerRes.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Invalid QR code — ticket not found." });
    }

    const passenger = passengerRes.rows[0];

    if (passenger.bus_id !== bus_id) {
      return res.status(403).json({
        error: "This ticket is for a different bus.",
      });
    }

    const alreadyBoarded = passenger.boarded;

    await pool.query(
      "UPDATE booking_passengers SET boarded = true, boarded_at = NOW() WHERE id = $1",
      [passenger.id],
    );

    res.json({
      message: "Passenger verified and marked as boarded.",
      passenger_name: passenger.passenger_name,
      seat_number: passenger.seat_number,
      board_stop: passenger.board_stop,
      drop_stop: passenger.drop_stop,
      already_boarded: alreadyBoarded,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
