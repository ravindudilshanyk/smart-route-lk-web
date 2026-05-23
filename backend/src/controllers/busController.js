const { pool } = require("../config/db");

async function getVerifiedOwnerId(userId) {
  const ownerResult = await pool.query(
    "SELECT id, status FROM bus_owners WHERE user_id = $1",
    [userId],
  );

  if (ownerResult.rows.length === 0) {
    return { error: "You must be a verified owner." };
  }

  const owner = ownerResult.rows[0];

  if (owner.status !== "verified") {
    return { error: "You must be a verified owner." };
  }

  return { ownerId: owner.id };
}

// ── ADD BUS ──────────────────────────────────────────
async function addBus(req, res) {
  const ownerLookup = await getVerifiedOwnerId(req.user.id);
  if (ownerLookup.error) {
    return res.status(403).json({ error: ownerLookup.error });
  }
  const owner_id = ownerLookup.ownerId;

  const {
    reg_number,
    bus_type,
    route_number,
    route_name,
    departure_time,
    arrival_time,
    operating_days,
    has_ac,
    has_wifi,
    has_water,
    price_per_km,
    min_fare,
    max_fare,
    refund_pct_before,
    refund_hours_threshold,
    refund_pct_within,
    stops,
    layout,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Create bus
    const busResult = await client.query(
      `INSERT INTO buses (
        owner_id, reg_number, bus_type, route_number, route_name,
        departure_time, arrival_time, operating_days,
        has_ac, has_wifi, has_water,
        price_per_km, min_fare, max_fare,
        refund_pct_before, refund_hours_threshold, refund_pct_within,
        status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'active')
      RETURNING id`,
      [
        owner_id,
        reg_number,
        bus_type,
        route_number,
        route_name,
        departure_time,
        arrival_time,
        operating_days,
        has_ac || false,
        has_wifi || false,
        has_water || false,
        price_per_km,
        min_fare,
        max_fare,
        refund_pct_before || 100,
        refund_hours_threshold || 24,
        refund_pct_within || 50,
      ],
    );
    const bus_id = busResult.rows[0].id;

    // 2. Create stops
    for (const stop of stops) {
      await client.query(
        `INSERT INTO bus_stops (bus_id, stop_name, stop_order, estimated_time, distance_from_start_km)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          bus_id,
          stop.stop_name,
          stop.stop_order,
          stop.estimated_time,
          stop.distance_from_start_km,
        ],
      );
    }

    // 3. Create seat layout
    const layoutResult = await client.query(
      `INSERT INTO seat_layouts (bus_id, rows, cols, aisle_col)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [bus_id, layout.rows, layout.cols, layout.aisle_col],
    );
    const layout_id = layoutResult.rows[0].id;

    // 4. Generate seats automatically
    let seatNum = 1;
    for (let row = 1; row <= layout.rows; row++) {
      for (let col = 0; col < layout.cols; col++) {
        if (col === layout.aisle_col) continue; // skip aisle
        await client.query(
          `INSERT INTO seats (layout_id, seat_number, row_index, col_index)
           VALUES ($1, $2, $3, $4)`,
          [layout_id, String(seatNum++).padStart(2, "0"), row, col],
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({
      message: "Bus added successfully.",
      bus_id,
      seat_count: seatNum - 1,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create bus error:", err.message);
    res.status(500).json({ error: "Failed to create bus." });
  } finally {
    client.release();
  }
}

// ── GET ALL BUSES FOR OWNER ──────────────────────────
async function getMyBuses(req, res) {
  try {
    const ownerLookup = await getVerifiedOwnerId(req.user.id);
    if (ownerLookup.error) {
      return res.status(403).json({ error: ownerLookup.error });
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
      [ownerLookup.ownerId],
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
