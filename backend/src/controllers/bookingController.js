const { pool } = require("../config/db");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

// ── Helper — generate QR code image ─────────────────
async function generateQR(token, bookingId) {
  const dir = "generated/qrcodes";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${token}.png`;
  const filepath = path.join(dir, filename);

  // QR contains a verification URL the conductor app will scan
  const qrData = JSON.stringify({
    token,
    booking_id: bookingId,
    app: "SmartRouteLK",
  });

  await QRCode.toFile(filepath, qrData, {
    width: 300,
    margin: 2,
    color: { dark: "#D0112B", light: "#FFFFFF" },
  });

  return `generated/qrcodes/${filename}`;
}

// ── Helper — calculate segment fare ─────────────────
function calcFare(pricePerKm, minFare, maxFare, fromDist, toDist) {
  const dist = parseFloat(toDist) - parseFloat(fromDist);
  const fare = dist * parseFloat(pricePerKm);
  return Math.min(
    Math.max(Math.round(fare), parseFloat(minFare)),
    parseFloat(maxFare),
  );
}

// ── CREATE BOOKING ───────────────────────────────────
async function createBooking(req, res) {
  const {
    bus_id,
    travel_date,
    board_stop_id,
    drop_stop_id,
    whatsapp_number,
    payment_method,
    passengers, // array: [{ passenger_name, nic, gender, seat_id }]
  } = req.body;

  const userId = req.user.id;

  // Basic validation
  if (
    !bus_id ||
    !travel_date ||
    !board_stop_id ||
    !drop_stop_id ||
    !whatsapp_number ||
    !payment_method ||
    !passengers ||
    passengers.length === 0
  ) {
    return res.status(400).json({ error: "All booking fields are required." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get bus details
    const busResult = await client.query(
      "SELECT * FROM buses WHERE id = $1 AND status = $2",
      [bus_id, "active"],
    );
    if (busResult.rows.length === 0) {
      return res.status(404).json({ error: "Bus not found or inactive." });
    }
    const bus = busResult.rows[0];

    // 2. Get board and drop stops
    const boardStop = await client.query(
      "SELECT * FROM bus_stops WHERE id = $1 AND bus_id = $2",
      [board_stop_id, bus_id],
    );
    const dropStop = await client.query(
      "SELECT * FROM bus_stops WHERE id = $1 AND bus_id = $2",
      [drop_stop_id, bus_id],
    );

    if (boardStop.rows.length === 0 || dropStop.rows.length === 0) {
      return res.status(400).json({ error: "Invalid board or drop stop." });
    }

    const board = boardStop.rows[0];
    const drop = dropStop.rows[0];

    if (board.stop_order >= drop.stop_order) {
      return res
        .status(400)
        .json({ error: "Board stop must come before drop stop." });
    }

    // 3. Check each seat is available for this segment
    for (const p of passengers) {
      // Verify seat belongs to this bus
      const seatCheck = await client.query(
        `SELECT s.id FROM seats s
         JOIN seat_layouts sl ON sl.id = s.layout_id
         WHERE s.id = $1 AND sl.bus_id = $2 AND s.is_active = true`,
        [p.seat_id, bus_id],
      );
      if (seatCheck.rows.length === 0) {
        return res.status(400).json({
          error: `Seat ${p.seat_id} is not valid for this bus.`,
        });
      }

      // Check seat not already booked for overlapping segment
      const conflictCheck = await client.query(
        `SELECT id FROM seat_availability
         WHERE seat_id = $1
           AND travel_date = $2
           AND board_stop_order < $4
           AND drop_stop_order  > $3`,
        [p.seat_id, travel_date, board.stop_order, drop.stop_order],
      );
      if (conflictCheck.rows.length > 0) {
        return res.status(400).json({
          error: `Seat is already booked for this segment. Please choose another seat.`,
        });
      }
    }

    // 4. Calculate fare per passenger
    const farePerSeat = calcFare(
      bus.price_per_km,
      bus.min_fare,
      bus.max_fare,
      board.distance_from_start_km,
      drop.distance_from_start_km,
    );
    const totalFare = farePerSeat * passengers.length;

    // 5. Create the booking
    const bookingResult = await client.query(
      `INSERT INTO bookings
        (bus_id, booked_by, travel_date, board_stop_id, drop_stop_id,
         total_fare, payment_method, whatsapp_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        bus_id,
        userId,
        travel_date,
        board_stop_id,
        drop_stop_id,
        totalFare,
        payment_method,
        whatsapp_number,
      ],
    );
    const bookingId = bookingResult.rows[0].id;

    // 6. Create booking passengers + seat availability + QR codes
    const createdPassengers = [];

    for (const p of passengers) {
      // Get seat number for display
      const seatInfo = await client.query(
        "SELECT seat_number FROM seats WHERE id = $1",
        [p.seat_id],
      );
      const seatNumber = seatInfo.rows[0].seat_number;

      // Insert booking passenger
      const bpResult = await client.query(
        `INSERT INTO booking_passengers
          (booking_id, passenger_name, nic, gender, seat_id, seat_number, fare)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, qr_token`,
        [
          bookingId,
          p.passenger_name,
          p.nic || null,
          p.gender || null,
          p.seat_id,
          seatNumber,
          farePerSeat,
        ],
      );

      const bp = bpResult.rows[0];

      // Generate QR code
      const qrUrl = await generateQR(bp.qr_token, bookingId);

      // Save QR url
      await client.query(
        "UPDATE booking_passengers SET qr_code_url = $1 WHERE id = $2",
        [qrUrl, bp.id],
      );

      // Lock the seat for this segment
      await client.query(
        `INSERT INTO seat_availability
          (seat_id, travel_date, board_stop_order, drop_stop_order, booking_passenger_id)
         VALUES ($1,$2,$3,$4,$5)`,
        [p.seat_id, travel_date, board.stop_order, drop.stop_order, bp.id],
      );

      createdPassengers.push({
        id: bp.id,
        passenger_name: p.passenger_name,
        seat_number: seatNumber,
        fare: farePerSeat,
        qr_token: bp.qr_token,
        qr_code_url: qrUrl,
      });
    }

    // 7. Commit everything
    await client.query("COMMIT");

    res.status(201).json({
      message: "Booking confirmed!",
      booking_id: bookingId,
      bus: bus.route_name,
      travel_date,
      from: board.stop_name,
      to: drop.stop_name,
      total_fare: totalFare,
      passengers: createdPassengers,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Booking error:", err.message);
    res.status(500).json({ error: "Server error during booking." });
  } finally {
    client.release();
  }
}

// ── GET MY BOOKINGS ──────────────────────────────────
async function getMyBookings(req, res) {
  try {
    const result = await pool.query(
      `SELECT
        b.id, b.travel_date, b.total_fare, b.booking_status,
        b.payment_method, b.payment_status, b.created_at,
        bus.route_name, bus.reg_number, bus.bus_type,
        s_board.stop_name AS board_stop,
        s_board.estimated_time AS board_time,
        s_drop.stop_name  AS drop_stop,
        s_drop.estimated_time  AS drop_time,
        COUNT(bp.id) AS passenger_count
       FROM bookings b
       JOIN buses     bus     ON bus.id     = b.bus_id
       JOIN bus_stops s_board ON s_board.id = b.board_stop_id
       JOIN bus_stops s_drop  ON s_drop.id  = b.drop_stop_id
       JOIN booking_passengers bp ON bp.booking_id = b.id
       WHERE b.booked_by = $1
       GROUP BY b.id, bus.route_name, bus.reg_number, bus.bus_type,
                s_board.stop_name, s_board.estimated_time,
                s_drop.stop_name, s_drop.estimated_time
       ORDER BY b.created_at DESC`,
      [req.user.id],
    );

    res.json({ bookings: result.rows });
  } catch (err) {
    console.error("Get bookings error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
}

// ── GET SINGLE BOOKING ───────────────────────────────
async function getBookingById(req, res) {
  const { id } = req.params;

  try {
    // Get booking
    const bookingResult = await pool.query(
      `SELECT b.*, 
        bus.route_name, bus.reg_number, bus.bus_type,
        bus.has_ac, bus.has_wifi, bus.has_water,
        s_board.stop_name AS board_stop_name,
        s_board.estimated_time AS board_time,
        s_drop.stop_name  AS drop_stop_name,
        s_drop.estimated_time  AS drop_time
       FROM bookings b
       JOIN buses     bus     ON bus.id     = b.bus_id
       JOIN bus_stops s_board ON s_board.id = b.board_stop_id
       JOIN bus_stops s_drop  ON s_drop.id  = b.drop_stop_id
       WHERE b.id = $1 AND b.booked_by = $2`,
      [id, req.user.id],
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found." });
    }

    // Get passengers with QR codes
    const passengersResult = await pool.query(
      `SELECT id, passenger_name, nic, gender,
              seat_number, fare, qr_token, qr_code_url,
              boarded, boarded_at, no_show
       FROM booking_passengers
       WHERE booking_id = $1`,
      [id],
    );

    res.json({
      booking: bookingResult.rows[0],
      passengers: passengersResult.rows,
    });
  } catch (err) {
    console.error("Get booking error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
}

// ── CANCEL BOOKING ───────────────────────────────────
async function cancelBooking(req, res) {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get booking with bus refund policy
    const result = await client.query(
      `SELECT b.*, bus.refund_pct_before, bus.refund_hours_threshold, bus.refund_pct_within,
              bus.departure_time
       FROM bookings b
       JOIN buses bus ON bus.id = b.bus_id
       WHERE b.id = $1 AND b.booked_by = $2`,
      [id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const booking = result.rows[0];

    if (booking.booking_status === "cancelled") {
      return res.status(400).json({ error: "Booking already cancelled." });
    }
    if (booking.booking_status === "completed") {
      return res
        .status(400)
        .json({ error: "Cannot cancel a completed booking." });
    }

    // Calculate refund based on policy
    const now = new Date();
    const departure = new Date(
      `${booking.travel_date.toISOString().split("T")[0]}T${booking.departure_time}`,
    );
    const hoursUntilDeparture = (departure - now) / (1000 * 60 * 60);

    let refundPct = 0;
    if (hoursUntilDeparture > booking.refund_hours_threshold) {
      refundPct = booking.refund_pct_before;
    } else if (hoursUntilDeparture > 0) {
      refundPct = booking.refund_pct_within;
    }

    const refundAmount = (booking.total_fare * refundPct) / 100;

    // Update booking status
    await client.query(
      `UPDATE bookings
       SET booking_status = 'cancelled', cancelled_at = NOW(), refund_amount = $1
       WHERE id = $2`,
      [refundAmount, id],
    );

    // Release seats — delete from seat_availability
    await client.query(
      `DELETE FROM seat_availability
       WHERE booking_passenger_id IN (
         SELECT id FROM booking_passengers WHERE booking_id = $1
       )`,
      [id],
    );

    await client.query("COMMIT");

    res.json({
      message: "Booking cancelled successfully.",
      refund_amount: refundAmount,
      refund_pct: refundPct,
      note:
        refundPct === 0
          ? "No refund — bus has already departed or refund window passed."
          : `${refundPct}% refund of ${refundAmount} LKR will be processed.`,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Cancel error:", err.message);
    res.status(500).json({ error: "Server error during cancellation." });
  } finally {
    client.release();
  }
}

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
};
