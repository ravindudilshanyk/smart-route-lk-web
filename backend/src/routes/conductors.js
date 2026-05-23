const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const authMiddleware = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

// ── Owner assigns conductor to bus ─────────────────
router.post(
  "/assign",
  authMiddleware,
  requireRole("owner"),
  async (req, res) => {
    const { bus_id, whatsapp_number } = req.body;

    if (!bus_id || !whatsapp_number) {
      return res
        .status(400)
        .json({ error: "bus_id and whatsapp_number required." });
    }

    try {
      // Find user by WhatsApp
      const userRes = await pool.query(
        "SELECT id, first_name, last_name, role FROM users WHERE whatsapp_number = $1",
        [whatsapp_number],
      );

      if (userRes.rows.length === 0) {
        return res
          .status(404)
          .json({
            error:
              "No user found with this WhatsApp number. They must register first.",
          });
      }

      const user = userRes.rows[0];

      // Check bus belongs to this owner
      const ownerRes = await pool.query(
        "SELECT id FROM bus_owners WHERE user_id = $1",
        [req.user.id],
      );
      const busCheck = await pool.query(
        "SELECT id FROM buses WHERE id = $1 AND owner_id = $2",
        [bus_id, ownerRes.rows[0]?.id],
      );

      if (busCheck.rows.length === 0) {
        return res
          .status(403)
          .json({ error: "This bus does not belong to you." });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Upgrade user role to conductor
        await client.query(
          "UPDATE users SET role = 'conductor' WHERE id = $1",
          [user.id],
        );

        // Create or update conductor record
        await client.query(
          `INSERT INTO conductors (user_id, bus_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id)
         DO UPDATE SET bus_id = $2, assigned_by = $3, updated_at = NOW()`,
          [user.id, bus_id, req.user.id],
        );

        await client.query("COMMIT");

        res.json({
          message: `${user.first_name} ${user.last_name} has been assigned as conductor.`,
          conductor: { name: `${user.first_name} ${user.last_name}`, bus_id },
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
  },
);

// ── Get conductors for owner's buses ───────────────
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

// ── Remove conductor ────────────────────────────────
router.delete(
  "/remove/:conductorId",
  authMiddleware,
  requireRole("owner"),
  async (req, res) => {
    try {
      const condRes = await pool.query(
        "SELECT user_id FROM conductors WHERE id = $1",
        [req.params.conductorId],
      );

      if (condRes.rows.length === 0) {
        return res.status(404).json({ error: "Conductor not found." });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("DELETE FROM conductors WHERE id = $1", [
          req.params.conductorId,
        ]);
        await client.query(
          "UPDATE users SET role = 'passenger' WHERE id = $1",
          [condRes.rows[0].user_id],
        );
        await client.query("COMMIT");
        res.json({
          message: "Conductor removed. User role reverted to passenger.",
        });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      res.status(500).json({ error: "Server error." });
    }
  },
);

module.exports = router;
