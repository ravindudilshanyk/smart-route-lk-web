const { pool } = require("../config/db");

// ── Helper — calculate fare for a segment ────────────
function calculateFare(bus, fromDistance, toDistance) {
  const distance = toDistance - fromDistance;
  const fare = distance * parseFloat(bus.price_per_km);
  const min = parseFloat(bus.min_fare);
  const max = parseFloat(bus.max_fare);
  return Math.min(Math.max(Math.round(fare), min), max);
}

// ── STOP SUGGESTIONS ────────────────────────────────
async function getStopSuggestions(req, res) {
  const query = (req.query.q || "").trim();

  if (!query) {
    return res.json({ stops: [] });
  }

  try {
    const result = await pool.query(
      `SELECT DISTINCT stop_name
       FROM bus_stops
       WHERE LOWER(stop_name) LIKE LOWER($1)
       ORDER BY stop_name
       LIMIT 12`,
      [`%${query}%`],
    );

    return res.json({
      stops: result.rows.map((row) => row.stop_name),
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load stop suggestions." });
  }
}

// ── SEARCH BUSES ─────────────────────────────────────
async function searchBuses(req, res) {
  const { origin, destination, date, time } = req.query;

  // Validate
  if (!origin || !destination || !date) {
    return res.status(400).json({
      error: "origin, destination and date are required.",
    });
  }

  if (origin.toLowerCase() === destination.toLowerCase()) {
    return res.status(400).json({
      error: "Origin and destination cannot be the same.",
    });
  }

  try {
    // ── Step 1: Find DIRECT buses ─────────────────────
    // A direct bus is one that has BOTH origin stop AND
    // destination stop, with origin appearing before destination
    const directResult = await pool.query(
      `SELECT DISTINCT
        b.id, b.reg_number, b.bus_type, b.route_number, b.route_name,
        b.departure_time, b.arrival_time, b.operating_days,
        b.price_per_km, b.min_fare, b.max_fare,
        b.has_ac, b.has_wifi, b.has_water,
        b.refund_pct_before, b.refund_hours_threshold, b.refund_pct_within,
        s_from.id        AS board_stop_id,
        s_from.stop_name AS board_stop_name,
        s_from.stop_order AS board_stop_order,
        s_from.estimated_time AS board_time,
        s_from.distance_from_start_km AS board_distance,
        s_to.id          AS drop_stop_id,
        s_to.stop_name   AS drop_stop_name,
        s_to.stop_order  AS drop_stop_order,
        s_to.estimated_time AS drop_time,
        s_to.distance_from_start_km AS drop_distance,
        COALESCE(AVG(br.rating), 0) AS rating,
        COUNT(DISTINCT br.id) AS review_count
       FROM buses b
       JOIN bus_stops s_from ON s_from.bus_id = b.id
       JOIN bus_stops s_to   ON s_to.bus_id   = b.id
       LEFT JOIN bus_reviews br ON br.bus_id   = b.id
       WHERE b.status = 'active'
         AND LOWER(s_from.stop_name) LIKE LOWER($1)
         AND LOWER(s_to.stop_name)   LIKE LOWER($2)
         AND s_from.stop_order < s_to.stop_order
       GROUP BY
        b.id, s_from.id, s_from.stop_name, s_from.stop_order,
        s_from.estimated_time, s_from.distance_from_start_km,
        s_to.id, s_to.stop_name, s_to.stop_order,
        s_to.estimated_time, s_to.distance_from_start_km
       ORDER BY s_from.estimated_time`,
      [`%${origin}%`, `%${destination}%`],
    );

    // Format direct results
    const directBuses = await Promise.all(
      directResult.rows.map(async (row) => {
        const fare = calculateFare(row, row.board_distance, row.drop_distance);
        const seats = await getAvailableSeats(
          row.id,
          date,
          row.board_stop_order,
          row.drop_stop_order,
        );

        return {
          type: "direct",
          transfers: 0,
          total_fare: fare,
          total_minutes: timeDiff(row.board_time, row.drop_time),
          legs: [
            {
              bus_id: row.id,
              reg_number: row.reg_number,
              bus_type: row.bus_type,
              route_number: row.route_number,
              route_name: row.route_name,
              board_stop_id: row.board_stop_id,
              board_stop_name: row.board_stop_name,
              board_time: row.board_time,
              drop_stop_id: row.drop_stop_id,
              drop_stop_name: row.drop_stop_name,
              drop_time: row.drop_time,
              fare,
              seats_available: seats,
              rating: parseFloat(row.rating).toFixed(1),
              review_count: parseInt(row.review_count),
              amenities: {
                ac: row.has_ac,
                wifi: row.has_wifi,
                water: row.has_water,
              },
            },
          ],
        };
      }),
    );

    // ── Step 2: Find CONNECTING buses (1 transfer) ────
    // Find buses that go from origin to a middle stop,
    // then another bus from that middle stop to destination
    const connectingResult = await pool.query(
      `SELECT
        b1.id AS bus1_id, b1.reg_number AS bus1_reg,
        b1.bus_type AS bus1_type, b1.route_number AS bus1_route,
        b1.price_per_km AS bus1_price_km,
        b1.min_fare AS bus1_min, b1.max_fare AS bus1_max,
        b1.has_ac AS bus1_ac, b1.has_wifi AS bus1_wifi,
        b1.has_water AS bus1_water,
        s1_from.id          AS leg1_board_id,
        s1_from.stop_name   AS leg1_board_name,
        s1_from.stop_order  AS leg1_board_order,
        s1_from.estimated_time AS leg1_board_time,
        s1_from.distance_from_start_km AS leg1_board_dist,
        s1_mid.id           AS leg1_drop_id,
        s1_mid.stop_name    AS transfer_stop_name,
        s1_mid.stop_order   AS leg1_drop_order,
        s1_mid.estimated_time AS leg1_drop_time,
        s1_mid.distance_from_start_km AS leg1_drop_dist,
        b2.id AS bus2_id, b2.reg_number AS bus2_reg,
        b2.bus_type AS bus2_type, b2.route_number AS bus2_route,
        b2.price_per_km AS bus2_price_km,
        b2.min_fare AS bus2_min, b2.max_fare AS bus2_max,
        b2.has_ac AS bus2_ac, b2.has_wifi AS bus2_wifi,
        b2.has_water AS bus2_water,
        s2_mid.id           AS leg2_board_id,
        s2_mid.stop_order   AS leg2_board_order,
        s2_mid.estimated_time AS leg2_board_time,
        s2_mid.distance_from_start_km AS leg2_board_dist,
        s2_to.id            AS leg2_drop_id,
        s2_to.stop_name     AS leg2_drop_name,
        s2_to.stop_order    AS leg2_drop_order,
        s2_to.estimated_time AS leg2_drop_time,
        s2_to.distance_from_start_km AS leg2_drop_dist
       FROM buses b1
       JOIN bus_stops s1_from ON s1_from.bus_id = b1.id
       JOIN bus_stops s1_mid  ON s1_mid.bus_id  = b1.id
       JOIN buses b2          ON b2.id != b1.id
       JOIN bus_stops s2_mid  ON s2_mid.bus_id  = b2.id
       JOIN bus_stops s2_to   ON s2_to.bus_id   = b2.id
       WHERE b1.status = 'active'
         AND b2.status = 'active'
         AND LOWER(s1_from.stop_name) LIKE LOWER($1)
         AND LOWER(s2_to.stop_name)   LIKE LOWER($2)
         AND LOWER(s1_mid.stop_name)  = LOWER(s2_mid.stop_name)
         AND s1_from.stop_order < s1_mid.stop_order
         AND s2_mid.stop_order  < s2_to.stop_order
         AND s1_mid.estimated_time < s2_mid.estimated_time
       LIMIT 10`,
      [`%${origin}%`, `%${destination}%`],
    );

    // Format connecting results
    const connectingBuses = await Promise.all(
      connectingResult.rows.map(async (row) => {
        const fare1 = calculateFare(
          {
            price_per_km: row.bus1_price_km,
            min_fare: row.bus1_min,
            max_fare: row.bus1_max,
          },
          row.leg1_board_dist,
          row.leg1_drop_dist,
        );
        const fare2 = calculateFare(
          {
            price_per_km: row.bus2_price_km,
            min_fare: row.bus2_min,
            max_fare: row.bus2_max,
          },
          row.leg2_board_dist,
          row.leg2_drop_dist,
        );

        const seats1 = await getAvailableSeats(
          row.bus1_id,
          date,
          row.leg1_board_order,
          row.leg1_drop_order,
        );
        const seats2 = await getAvailableSeats(
          row.bus2_id,
          date,
          row.leg2_board_order,
          row.leg2_drop_order,
        );

        const waitMinutes = timeDiff(row.leg1_drop_time, row.leg2_board_time);

        return {
          type: "connecting",
          transfers: 1,
          transfer_stop: row.transfer_stop_name,
          wait_minutes: waitMinutes,
          total_fare: fare1 + fare2,
          total_minutes: timeDiff(row.leg1_board_time, row.leg2_drop_time),
          legs: [
            {
              leg: 1,
              bus_id: row.bus1_id,
              reg_number: row.bus1_reg,
              bus_type: row.bus1_type,
              route_number: row.bus1_route,
              board_stop_id: row.leg1_board_id,
              board_stop_name: row.leg1_board_name,
              board_time: row.leg1_board_time,
              drop_stop_id: row.leg1_drop_id,
              drop_stop_name: row.transfer_stop_name,
              drop_time: row.leg1_drop_time,
              fare: fare1,
              seats_available: seats1,
              amenities: {
                ac: row.bus1_ac,
                wifi: row.bus1_wifi,
                water: row.bus1_water,
              },
            },
            {
              leg: 2,
              bus_id: row.bus2_id,
              reg_number: row.bus2_reg,
              bus_type: row.bus2_type,
              route_number: row.bus2_route,
              board_stop_id: row.leg2_board_id,
              board_stop_name: row.transfer_stop_name,
              board_time: row.leg2_board_time,
              drop_stop_id: row.leg2_drop_id,
              drop_stop_name: row.leg2_drop_name,
              drop_time: row.leg2_drop_time,
              fare: fare2,
              seats_available: seats2,
              amenities: {
                ac: row.bus2_ac,
                wifi: row.bus2_wifi,
                water: row.bus2_water,
              },
            },
          ],
        };
      }),
    );

    // ── Step 3: Combine & sort ─────────────────────────
    // Direct buses always come first, then connecting
    const results = [...directBuses, ...connectingBuses].sort((a, b) => {
      if (a.transfers !== b.transfers) return a.transfers - b.transfers;
      return a.total_minutes - b.total_minutes;
    });

    res.json({
      origin,
      destination,
      date,
      total_results: results.length,
      direct_count: directBuses.length,
      connecting_count: connectingBuses.length,
      results,
    });
  } catch (err) {
    console.error("Search error FULL:", err); // changed to log full error
    res.status(500).json({ error: err.message }); // send real message to client
  }
}

// ── Helper — available seat count for a segment ──────
async function getAvailableSeats(busId, date, boardOrder, dropOrder) {
  try {
    // Total active seats on this bus
    const totalResult = await pool.query(
      `SELECT COUNT(s.id) as total
       FROM seats s
       JOIN seat_layouts sl ON sl.id = s.layout_id
       WHERE sl.bus_id = $1 AND s.is_active = true`,
      [busId],
    );
    const total = parseInt(totalResult.rows[0].total);

    // Seats already booked that OVERLAP with this segment
    // A seat is unavailable if an existing booking's segment overlaps
    const bookedResult = await pool.query(
      `SELECT COUNT(DISTINCT sa.seat_id) as booked
       FROM seat_availability sa
       JOIN seats s ON s.id = sa.seat_id
       JOIN seat_layouts sl ON sl.id = s.layout_id
       WHERE sl.bus_id = $1
         AND sa.travel_date = $2
         AND sa.board_stop_order < $4
         AND sa.drop_stop_order  > $3`,
      [busId, date, boardOrder, dropOrder],
    );
    const booked = parseInt(bookedResult.rows[0].booked);

    return Math.max(0, total - booked);
  } catch {
    return 0;
  }
}

// ── Helper — minutes between two HH:MM times ─────────
function timeDiff(from, to) {
  if (!from || !to) return 0;
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  return th * 60 + tm - (fh * 60 + fm);
}

module.exports = { searchBuses, getStopSuggestions };
