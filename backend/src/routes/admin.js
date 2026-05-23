const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const authMiddleware = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

// All admin routes require auth + admin role
router.use(authMiddleware);
router.use(requireRole("admin"));

// ── Stats ──────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [users, owners, buses, bookings, revenue, pending] =
      await Promise.all([
        pool.query("SELECT COUNT(*) FROM users"),
        pool.query("SELECT COUNT(*) FROM bus_owners WHERE status = 'verified'"),
        pool.query("SELECT COUNT(*) FROM buses WHERE status = 'active'"),
        pool.query("SELECT COUNT(*) FROM bookings"),
        pool.query(
          "SELECT COALESCE(SUM(total_fare),0) FROM bookings WHERE booking_status = 'confirmed'",
        ),
        pool.query(
          "SELECT COUNT(*) FROM bus_owners WHERE status = 'pending_verification'",
        ),
      ]);
    res.json({
      total_users: parseInt(users.rows[0].count),
      total_owners: parseInt(owners.rows[0].count),
      total_buses: parseInt(buses.rows[0].count),
      total_bookings: parseInt(bookings.rows[0].count),
      total_revenue: parseFloat(revenue.rows[0].coalesce),
      pending_owners: parseInt(pending.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// ── Owners ─────────────────────────────────────────
router.get("/owners", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bo.*, u.first_name, u.last_name, u.whatsapp_number, u.nic
       FROM bus_owners bo
       JOIN users u ON u.id = bo.user_id
       ORDER BY bo.created_at DESC`,
    );
    res.json({ owners: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

router.patch("/owners/:id/verify", async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "Invalid action." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const newStatus = action === "approve" ? "verified" : "rejected";
    await client.query("UPDATE bus_owners SET status = $1 WHERE id = $2", [
      newStatus,
      id,
    ]);

    // If approved, upgrade user role to owner
    if (action === "approve") {
      const ownerRes = await client.query(
        "SELECT user_id FROM bus_owners WHERE id = $1",
        [id],
      );
      if (ownerRes.rows.length > 0) {
        await client.query("UPDATE users SET role = 'owner' WHERE id = $1", [
          ownerRes.rows[0].user_id,
        ]);
      }
    }

    await client.query("COMMIT");
    res.json({ message: `Owner ${action}d successfully.` });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Server error." });
  } finally {
    client.release();
  }
});

// ── Users ──────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, whatsapp_number, email,
              role, status, created_at
       FROM users ORDER BY created_at DESC`,
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

router.patch("/users/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }
  try {
    await pool.query("UPDATE users SET status = $1 WHERE id = $2", [
      status,
      id,
    ]);
    res.json({ message: "User status updated." });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// ── Buses ──────────────────────────────────────────
router.get("/buses", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*,
              u.first_name || ' ' || u.last_name AS owner_name,
              (SELECT COUNT(*) FROM seat_layouts sl JOIN seats s ON s.layout_id = sl.id WHERE sl.bus_id = b.id) AS seat_count,
              (SELECT COUNT(*) FROM bookings bk WHERE bk.bus_id = b.id) AS booking_count
       FROM buses b
       JOIN bus_owners bo ON bo.id = b.owner_id
       JOIN users u ON u.id = bo.user_id
       ORDER BY b.created_at DESC`,
    );
    res.json({ buses: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// ── Bookings ───────────────────────────────────────
router.get("/bookings", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bk.*,
              u.first_name, u.last_name,
              b.reg_number,
              bs1.stop_name AS board_stop,
              bs2.stop_name AS drop_stop
       FROM bookings bk
       JOIN users u  ON u.id  = bk.booked_by
       JOIN buses b  ON b.id  = bk.bus_id
       JOIN bus_stops bs1 ON bs1.id = bk.board_stop_id
       JOIN bus_stops bs2 ON bs2.id = bk.drop_stop_id
       ORDER BY bk.created_at DESC
       LIMIT 100`,
    );
    res.json({ bookings: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
