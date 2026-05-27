const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const authMiddleware = require("../middleware/auth");

// ── Complete profile - Level 2 (WhatsApp + gender) ──
router.patch("/complete-profile", authMiddleware, async (req, res) => {
  const { nic, date_of_birth, gender, whatsapp_number } = req.body;

  if (!whatsapp_number || !gender) {
    return res.status(400).json({ error: "WhatsApp and gender are required." });
  }

  try {
    // Check WhatsApp not taken
    const waCheck = await pool.query(
      "SELECT id FROM users WHERE whatsapp_number = $1 AND id != $2",
      [whatsapp_number, req.user.id],
    );
    if (waCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "WhatsApp number already registered." });
    }

    // Check NIC not taken if provided
    if (nic) {
      const nicCheck = await pool.query(
        "SELECT id FROM users WHERE nic = $1 AND id != $2",
        [nic, req.user.id],
      );
      if (nicCheck.rows.length > 0) {
        return res.status(400).json({ error: "NIC already registered." });
      }
    }

    const level = nic && date_of_birth ? 3 : 2;

    await pool.query(
      `UPDATE users SET
        whatsapp_number = $1,
        gender          = $2,
        nic             = COALESCE($3, nic),
        date_of_birth   = COALESCE($4, date_of_birth),
        profile_level   = $5
       WHERE id = $6`,
      [
        whatsapp_number,
        gender,
        nic || null,
        date_of_birth || null,
        level,
        req.user.id,
      ],
    );

    res.json({ message: "Profile updated.", profile_level: level });
  } catch (err) {
    console.error("Complete profile error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

// ── Update profile ────────────────────────────────────
router.patch("/update-profile", authMiddleware, async (req, res) => {
  const { whatsapp_number, email } = req.body;
  try {
    if (whatsapp_number) {
      const check = await pool.query(
        "SELECT id FROM users WHERE whatsapp_number = $1 AND id != $2",
        [whatsapp_number, req.user.id],
      );
      if (check.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "WhatsApp number already in use." });
      }
    }
    await pool.query(
      `UPDATE users SET
        whatsapp_number = COALESCE($1, whatsapp_number),
        email           = COALESCE($2, email)
       WHERE id = $3`,
      [whatsapp_number || null, email || null, req.user.id],
    );
    res.json({ message: "Profile updated." });
  } catch (err) {
    res.status(500).json({ error: "Update failed." });
  }
});

module.exports = router;
