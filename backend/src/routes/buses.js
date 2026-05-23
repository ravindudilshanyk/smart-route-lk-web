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

// Update bus info
router.patch("/:id", authMiddleware, requireRole("owner"), async (req, res) => {
  const { id } = req.params;
  const {
    route_number,
    route_name,
    departure_time,
    arrival_time,
    operating_days,
    has_ac,
    has_wifi,
    has_water,
    status,
  } = req.body;

  try {
    const ownerRes = await pool.query(
      "SELECT id FROM bus_owners WHERE user_id = $1",
      [req.user.id],
    );
    const busCheck = await pool.query(
      "SELECT id FROM buses WHERE id = $1 AND owner_id = $2",
      [id, ownerRes.rows[0]?.id],
    );
    if (busCheck.rows.length === 0)
      return res.status(403).json({ error: "Not your bus." });

    await pool.query(
      `UPDATE buses SET
        route_number = $1, route_name = $2,
        departure_time = $3, arrival_time = $4,
        operating_days = $5, has_ac = $6, has_wifi = $7,
        has_water = $8, status = $9
       WHERE id = $10`,
      [
        route_number,
        route_name,
        departure_time,
        arrival_time,
        operating_days,
        has_ac,
        has_wifi,
        has_water,
        status,
        id,
      ],
    );
    res.json({ message: "Bus updated." });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// Update stops
router.put(
  "/:id/stops",
  authMiddleware,
  requireRole("owner"),
  async (req, res) => {
    const { id } = req.params;
    const { stops } = req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM bus_stops WHERE bus_id = $1", [id]);
      for (const stop of stops) {
        await client.query(
          `INSERT INTO bus_stops (bus_id, stop_name, stop_order, estimated_time, distance_from_start_km)
         VALUES ($1, $2, $3, $4, $5)`,
          [
            id,
            stop.stop_name,
            stop.stop_order,
            stop.estimated_time,
            stop.distance_from_start_km,
          ],
        );
      }
      await client.query("COMMIT");
      res.json({ message: "Stops updated." });
    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: "Server error." });
    } finally {
      client.release();
    }
  },
);

// Update pricing
router.patch(
  "/:id/pricing",
  authMiddleware,
  requireRole("owner"),
  async (req, res) => {
    const { id } = req.params;
    const {
      price_per_km,
      min_fare,
      max_fare,
      refund_pct_before,
      refund_hours_threshold,
      refund_pct_within,
    } = req.body;

    try {
      await pool.query(
        `UPDATE buses SET
        price_per_km = $1, min_fare = $2, max_fare = $3,
        refund_pct_before = $4, refund_hours_threshold = $5, refund_pct_within = $6
       WHERE id = $7`,
        [
          price_per_km,
          min_fare,
          max_fare,
          refund_pct_before,
          refund_hours_threshold,
          refund_pct_within,
          id,
        ],
      );
      res.json({ message: "Pricing updated." });
    } catch (err) {
      res.status(500).json({ error: "Server error." });
    }
  },
);

// Get bus reviews
router.get("/:id/reviews", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.*, u.first_name || ' ' || LEFT(u.last_name, 1) || '.' AS reviewer_name
       FROM bus_reviews br
       JOIN users u ON u.id = br.user_id
       WHERE br.bus_id = $1 AND br.is_visible = true
       ORDER BY br.created_at DESC`,
      [req.params.id],
    );
    res.json({ reviews: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
