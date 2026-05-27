const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const authMiddleware = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

// ── Assign conductor to bus ────────────────────────
router.post("/assign", authMiddleware, async (req, res) => {
  if (req.user.role !== "owner" && req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only bus owners can assign conductors." });
  }

  const { bus_id, whatsapp_number } = req.body;
  if (!bus_id || !whatsapp_number) {
    return res
      .status(400)
      .json({ error: "bus_id and whatsapp_number required." });
  }

  try {
    // Find user by WhatsApp
    const userRes = await pool.query(
      `SELECT id, first_name, last_name, role
       FROM users
       WHERE regexp_replace(whatsapp_number, '\\D', '', 'g') 
           = regexp_replace($1, '\\D', '', 'g')`,
      [whatsapp_number],
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        error:
          "No user found with this WhatsApp number. They must register on SmartRoute LK first.",
      });
    }

    const targetUser = userRes.rows[0];

    // Check bus belongs to this owner
    const ownerRes = await pool.query(
      "SELECT id FROM bus_owners WHERE user_id = $1",
      [req.user.id],
    );

    if (ownerRes.rows.length === 0) {
      return res.status(403).json({ error: "Owner profile not found." });
    }

    const busCheck = await pool.query(
      "SELECT id, reg_number, route_name FROM buses WHERE id = $1 AND owner_id = $2",
      [bus_id, ownerRes.rows[0].id],
    );

    if (busCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "This bus does not belong to you." });
    }

    const bus = busCheck.rows[0];

    // ── Check if already assigned to another bus ──────
    const existingConductor = await pool.query(
      `SELECT c.id, c.bus_id, b.reg_number, b.route_name
       FROM conductors c
       JOIN buses b ON b.id = c.bus_id
       WHERE c.user_id = $1`,
      [targetUser.id],
    );

    if (existingConductor.rows.length > 0) {
      const existing = existingConductor.rows[0];

      // If already assigned to THIS bus — nothing to do
      if (existing.bus_id === bus_id) {
        return res.status(400).json({
          error: `${targetUser.first_name} is already the conductor for this bus.`,
        });
      }

      // Assigned to a DIFFERENT bus — return conflict info
      return res.status(409).json({
        error: "conductor_conflict",
        message: `${targetUser.first_name} ${targetUser.last_name} is currently assigned to ${existing.reg_number} (${existing.route_name}).`,
        conductor: {
          id: targetUser.id,
          name: `${targetUser.first_name} ${targetUser.last_name}`,
          current_bus_id: existing.bus_id,
          current_reg: existing.reg_number,
          current_route: existing.route_name,
          new_bus_id: bus_id,
          new_reg: bus.reg_number,
          new_route: bus.route_name,
        },
      });
    }

    // ── No conflict — assign directly ─────────────────
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query("UPDATE users SET role = 'conductor' WHERE id = $1", [
        targetUser.id,
      ]);

      await client.query(
        `INSERT INTO conductors (user_id, bus_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id)
         DO UPDATE SET bus_id = $2, assigned_by = $3, updated_at = NOW()`,
        [targetUser.id, bus_id, req.user.id],
      );

      await client.query("COMMIT");

      res.json({
        message: `${targetUser.first_name} ${targetUser.last_name} has been assigned as conductor for ${bus.reg_number}.`,
        conductor: {
          name: `${targetUser.first_name} ${targetUser.last_name}`,
          bus: bus.reg_number,
          route: bus.route_name,
        },
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error." });
  }
});

// ── Force reassign (owner confirms override) ───────
router.post("/reassign", authMiddleware, async (req, res) => {
  if (req.user.role !== "owner" && req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only bus owners can reassign conductors." });
  }

  const { conductor_user_id, new_bus_id } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query("UPDATE users SET role = 'conductor' WHERE id = $1", [
      conductor_user_id,
    ]);

    await client.query(
      `INSERT INTO conductors (user_id, bus_id, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET bus_id = $2, assigned_by = $3, updated_at = NOW()`,
      [conductor_user_id, new_bus_id, req.user.id],
    );

    await client.query("COMMIT");
    res.json({ message: "Conductor reassigned successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Server error." });
  } finally {
    client.release();
  }
});

// ── Remove conductor ────────────────────────────────
router.delete("/remove/:conductorId", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const condRes = await client.query(
      "SELECT user_id FROM conductors WHERE id = $1",
      [req.params.conductorId],
    );
    if (condRes.rows.length === 0) {
      return res.status(404).json({ error: "Conductor not found." });
    }
    await client.query("DELETE FROM conductors WHERE id = $1", [
      req.params.conductorId,
    ]);
    await client.query("UPDATE users SET role = 'passenger' WHERE id = $1", [
      condRes.rows[0].user_id,
    ]);
    await client.query("COMMIT");
    res.json({ message: "Conductor removed. User reverted to passenger." });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Server error." });
  } finally {
    client.release();
  }
});

// ── Get owner's conductors ──────────────────────────
router.get(
  "/my-conductors",
  authMiddleware,
  requireRole("owner"),
  async (req, res) => {
    try {
      const ownerRes = await pool.query(
        "SELECT id FROM bus_owners WHERE user_id = $1",
        [req.user.id],
      );
      const result = await pool.query(
        `SELECT c.id, c.bus_id, c.created_at,
              u.first_name, u.last_name, u.whatsapp_number,
              b.reg_number, b.route_name
       FROM conductors c
       JOIN users u ON u.id = c.user_id
       JOIN buses b ON b.id = c.bus_id
       WHERE b.owner_id = $1
       ORDER BY c.created_at DESC`,
        [ownerRes.rows[0]?.id],
      );
      res.json({ conductors: result.rows });
    } catch (err) {
      res.status(500).json({ error: "Server error." });
    }
  },
);

module.exports = router;
