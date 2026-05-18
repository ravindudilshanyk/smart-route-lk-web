const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { pool } = require("../config/db");

// Complete profile after Google signup
router.patch("/complete-profile", authMiddleware, async (req, res) => {
  const { nic, date_of_birth, gender, whatsapp_number } = req.body;

  if (!nic || !date_of_birth || !gender || !whatsapp_number) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Check NIC not already used
    const nicCheck = await pool.query(
      "SELECT id FROM users WHERE nic = $1 AND id != $2",
      [nic, req.user.id],
    );
    if (nicCheck.rows.length > 0) {
      return res.status(400).json({ error: "NIC already registered." });
    }

    // Check WhatsApp not already used
    const waCheck = await pool.query(
      "SELECT id FROM users WHERE whatsapp_number = $1 AND id != $2",
      [whatsapp_number, req.user.id],
    );
    if (waCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "WhatsApp number already registered." });
    }

    await pool.query(
      `UPDATE users
       SET nic = $1, date_of_birth = $2, gender = $3, whatsapp_number = $4
       WHERE id = $5`,
      [nic, date_of_birth, gender, whatsapp_number, req.user.id],
    );

    res.json({ message: "Profile completed successfully." });
  } catch (err) {
    console.error("Complete profile error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
