const { pool } = require("../config/db");

// ── ADD BUS ──────────────────────────────────────────
async function addBus(req, res) {
  const {
    reg_number,
    bus_type,
    route_number,
    route_name,
    departure_time,
    arrival_time,
    operating_days,
    gps_device_id,
    price_per_km,
    min_fare,
    max_fare,
    refund_pct_before,
    refund_hours_threshold,
    refund_pct_within,
    has_ac,
    has_wifi,
    has_water,
    stops, // array of stop objects
    seat_layout, // object with rows, cols, aisle_col, seats array
  } = req.body;

  const userId = req.user.id;

  // Validate required fields
  if (
    !reg_number ||
    !bus_type ||
    !route_number ||
    !route_name ||
    !departure_time ||
    !arrival_time ||
    !operating_days ||
    !price_per_km ||
    !max_fare
  ) {
    return res.status(400).json({ error: "Missing required bus fields." });
  }

  if (!stops || stops.length < 2) {
    return res.status(400).json({ error: "At least 2 stops are required." });
  }

  if (!seat_layout || !seat_layout.seats || seat_layout.seats.length === 0) {
    return res.status(400).json({ error: "Seat layout is required." });
  }

  // Use a transaction — if anything fails, everything rolls back
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get owner profile id
    const ownerResult = await client.query(
      "SELECT id, status FROM bus_owners WHERE user_id = $1",
      [userId],
    );

    if (ownerResult.rows.length === 0) {
      return res.status(403).json({ error: "Owner profile not found." });
    }

    const owner = ownerResult.rows[0];

    if (owner.status !== "verified") {
      return res.status(403).json({
        error:
          "Your owner account is not verified yet. Please wait for admin approval.",
      });
    }

    // 2. Check reg number not already used
    const regCheck = await client.query(
      "SELECT id FROM buses WHERE reg_number = $1",
      [reg_number],
    );
    if (regCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Bus registration number already exists." });
    }

    // 3. Insert the bus
    const busResult = await client.query(
      `INSERT INTO buses (
        owner_id, reg_number, bus_type, route_number, route_name,
        departure_time, arrival_time, operating_days, gps_device_id,
        price_per_km, min_fare, max_fare,
        refund_pct_before, refund_hours_threshold, refund_pct_within,
        has_ac, has_wifi, has_water
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      ) RETURNING id`,
      [
        owner.id,
        reg_number,
        bus_type,
        route_number,
        route_name,
        departure_time,
        arrival_time,
        operating_days,
        gps_device_id || null,
        price_per_km,
        min_fare || 50,
        max_fare,
        refund_pct_before || 100,
        refund_hours_threshold || 24,
        refund_pct_within || 50,
        has_ac || false,
        has_wifi || false,
        has_water || false,
      ],
    );

    const busId = busResult.rows[0].id;

    // 4. Insert stops
    for (const stop of stops) {
      await client.query(
        `INSERT INTO bus_stops 
          (bus_id, stop_name, stop_order, estimated_time, distance_from_start_km)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          busId,
          stop.stop_name,
          stop.stop_order,
          stop.estimated_time,
          stop.distance_from_start_km || null,
        ],
      );
    }

    // 5. Insert seat layout
    const layoutResult = await client.query(
      `INSERT INTO seat_layouts (bus_id, rows, cols, aisle_col)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [busId, seat_layout.rows, seat_layout.cols, seat_layout.aisle_col || 2],
    );

    const layoutId = layoutResult.rows[0].id;

    // 6. Insert individual seats
    for (const seat of seat_layout.seats) {
      await client.query(
        `INSERT INTO seats (layout_id, seat_number, row_index, col_index, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          layoutId,
          seat.seat_number,
          seat.row_index,
          seat.col_index,
          seat.is_active !== false, // default true
        ],
      );
    }

    // 7. Commit everything
    await client.query("COMMIT");

    res.status(201).json({
      message: "Bus added successfully.",
      bus_id: busId,
      stops_added: stops.length,
      seats_added: seat_layout.seats.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Add bus error:", err.message);
    res.status(500).json({ error: "Server error while adding bus." });
  } finally {
    client.release();
  }
}

// ── GET ALL BUSES FOR OWNER ──────────────────────────
async function getMyBuses(req, res) {
  try {
    const ownerResult = await pool.query(
      "SELECT id FROM bus_owners WHERE user_id = $1",
      [req.user.id],
    );

    if (ownerResult.rows.length === 0) {
      return res.status(404).json({ error: "Owner profile not found." });
    }

    const buses = await pool.query(
      `SELECT b.*, 
        COUNT(DISTINCT bs.id) as stop_count,
        COUNT(DISTINCT s.id)  as seat_count
       FROM buses b
       LEFT JOIN bus_stops bs ON bs.bus_id = b.id
       LEFT JOIN seat_layouts sl ON sl.bus_id = b.id
       LEFT JOIN seats s ON s.layout_id = sl.id AND s.is_active = true
       WHERE b.owner_id = $1
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [ownerResult.rows[0].id],
    );

    res.json({ buses: buses.rows });
  } catch (err) {
    console.error("Get buses error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
}

// ── GET SINGLE BUS WITH STOPS & LAYOUT ──────────────
async function getBusById(req, res) {
  const { id } = req.params;

  try {
    // Get bus
    const busResult = await pool.query("SELECT * FROM buses WHERE id = $1", [
      id,
    ]);

    if (busResult.rows.length === 0) {
      return res.status(404).json({ error: "Bus not found." });
    }

    // Get stops
    const stopsResult = await pool.query(
      "SELECT * FROM bus_stops WHERE bus_id = $1 ORDER BY stop_order",
      [id],
    );

    // Get seat layout
    const layoutResult = await pool.query(
      "SELECT * FROM seat_layouts WHERE bus_id = $1",
      [id],
    );

    let seats = [];
    if (layoutResult.rows.length > 0) {
      const seatsResult = await pool.query(
        "SELECT * FROM seats WHERE layout_id = $1 ORDER BY row_index, col_index",
        [layoutResult.rows[0].id],
      );
      seats = seatsResult.rows;
    }

    res.json({
      bus: busResult.rows[0],
      stops: stopsResult.rows,
      layout: layoutResult.rows[0] || null,
      seats,
    });
  } catch (err) {
    console.error("Get bus error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
}

module.exports = { addBus, getMyBuses, getBusById };
