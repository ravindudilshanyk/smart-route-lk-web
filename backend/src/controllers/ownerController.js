const { pool } = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ── File upload config ───────────────────────────────
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/documents";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // e.g. userId_nic_front_1234567890.jpg
    const unique = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}_${file.fieldname}_${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and PDF files are allowed."));
    }
  },
});

// Export upload middleware for use in routes
const uploadDocs = upload.fields([
  { name: "nic_front", maxCount: 1 },
  { name: "nic_back", maxCount: 1 },
  { name: "revenue_licence", maxCount: 1 },
  { name: "bus_permit", maxCount: 1 },
]);

// ── APPLY FOR OWNER ──────────────────────────────────
async function applyOwner(req, res) {
  const {
    business_name,
    business_reg_number,
    district,
    address,
    whatsapp_alerts,
  } = req.body;

  // Validate required fields
  if (!district || !address || !whatsapp_alerts) {
    return res.status(400).json({
      error: "district, address and whatsapp_alerts are required.",
      received: req.body, // shows what actually arrived
    });
  }

  const userId = req.user.id;

  try {
    // 1. Check if already applied
    const existing = await pool.query(
      "SELECT id, status FROM bus_owners WHERE user_id = $1",
      [userId],
    );

    if (existing.rows.length > 0) {
      const status = existing.rows[0].status;
      if (status === "pending_verification") {
        return res.status(400).json({
          error: "You already have a pending application.",
        });
      }
      if (status === "verified") {
        return res.status(400).json({
          error: "You are already a verified owner.",
        });
      }
    }

    // 2. Get uploaded file paths
    const files = req.files || {};
    const nic_front_url = files.nic_front?.[0]?.path || null;
    const nic_back_url = files.nic_back?.[0]?.path || null;
    const revenue_licence_url = files.revenue_licence?.[0]?.path || null;
    const bus_permit_url = files.bus_permit?.[0]?.path || null;

    // 3. Insert owner application
    const result = await pool.query(
      `INSERT INTO bus_owners
        (user_id, business_name, business_reg_number, district, address,
         whatsapp_alerts, nic_front_url, nic_back_url,
         revenue_licence_url, bus_permit_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, status`,
      [
        userId,
        business_name || null,
        business_reg_number || null,
        district,
        address,
        whatsapp_alerts,
        nic_front_url,
        nic_back_url,
        revenue_licence_url,
        bus_permit_url,
      ],
    );

    // 4. Update user role to owner
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [
      "owner",
      userId,
    ]);

    res.status(201).json({
      message:
        "Owner application submitted. Admin will verify within 24 hours.",
      application_id: result.rows[0].id,
      status: result.rows[0].status,
    });
  } catch (err) {
    console.error("Apply owner error:", err.message);
    res.status(500).json({ error: "Server error during application." });
  }
}

// ── GET OWNER PROFILE ────────────────────────────────
async function getOwnerProfile(req, res) {
  try {
    const result = await pool.query(
      `SELECT o.*, u.first_name, u.last_name, u.whatsapp_number
       FROM bus_owners o
       JOIN users u ON u.id = o.user_id
       WHERE o.user_id = $1`,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Owner profile not found." });
    }

    res.json({ owner: result.rows[0] });
  } catch (err) {
    console.error("Get owner profile error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
}

module.exports = { applyOwner, getOwnerProfile, uploadDocs };
