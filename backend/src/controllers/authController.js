const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

function normalizeWhatsAppNumber(value) {
  if (!value) return "";

  const compact = String(value).trim().replace(/[\s-]/g, "");

  if (compact.startsWith("0") && compact.length === 10) {
    return `+94${compact.slice(1)}`;
  }

  if (compact.startsWith("94") && !compact.startsWith("+")) {
    return `+${compact}`;
  }

  return compact;
}

function toDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function buildWhatsAppVariants(value) {
  const normalized = normalizeWhatsAppNumber(value);
  const digits = toDigits(normalized);
  const variants = new Set([digits]);

  // Support both local (077...) and intl (9477...) forms.
  if (digits.startsWith("94") && digits.length === 11) {
    variants.add(`0${digits.slice(2)}`);
  }
  if (digits.startsWith("0") && digits.length === 10) {
    variants.add(`94${digits.slice(1)}`);
  }

  return Array.from(variants).filter(Boolean);
}

// ── Helper - generate JWT token ─────────────────────
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: `${user.first_name} ${user.last_name}`,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );
}

// ── REGISTER ────────────────────────────────────────
async function register(req, res) {
  const {
    nic,
    first_name,
    last_name,
    date_of_birth,
    gender,
    whatsapp_number,
    email,
    password,
  } = req.body;

  const normalizedWhatsAppNumber = normalizeWhatsAppNumber(whatsapp_number);
  const whatsappVariants = buildWhatsAppVariants(whatsapp_number);

  try {
    // 1. Check if NIC already exists
    const nicCheck = await pool.query("SELECT id FROM users WHERE nic = $1", [
      nic,
    ]);
    if (nicCheck.rows.length > 0) {
      return res.status(400).json({ error: "NIC already registered." });
    }

    // 2. Check if WhatsApp number already exists
    const waCheck = await pool.query(
      `SELECT id FROM users
       WHERE regexp_replace(whatsapp_number, '\\D', '', 'g') = ANY($1::text[])`,
      [whatsappVariants],
    );
    if (waCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "WhatsApp number already registered." });
    }

    // 3. Hash the password - never store plain text
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 4. Insert new user
    const result = await pool.query(
      `INSERT INTO users 
        (nic, first_name, last_name, date_of_birth, gender, whatsapp_number, email, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, first_name, last_name, role, whatsapp_number`,
      [
        nic,
        first_name,
        last_name,
        date_of_birth,
        gender,
        normalizedWhatsAppNumber,
        email || null,
        password_hash,
      ],
    );

    const user = result.rows[0];

    // 5. Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Server error during registration." });
  }
}

// ── LOGIN ────────────────────────────────────────────
async function login(req, res) {
  const { whatsapp_number, password } = req.body;
  const whatsappVariants = buildWhatsAppVariants(whatsapp_number);

  try {
    // 1. Find user by WhatsApp number
    const result = await pool.query(
      `SELECT id, first_name, last_name, role, password_hash, status 
       FROM users
       WHERE regexp_replace(whatsapp_number, '\\D', '', 'g') = ANY($1::text[])
       LIMIT 1`,
      [whatsappVariants],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid number or password." });
    }

    const user = result.rows[0];

    // 2. Check if account is active
    if (user.status === "suspended") {
      return res
        .status(403)
        .json({ error: "Account suspended. Contact support." });
    }

    // 3. Compare password with hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid number or password." });
    }

    // 4. Generate token
    const token = generateToken(user);

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error during login." });
  }
}

// ── GET CURRENT USER ─────────────────────────────────
async function getMe(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, nic, gender, date_of_birth, whatsapp_number, 
              email, role, status, wallet_balance, loyalty_points, created_at
       FROM users WHERE id = $1`,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("GetMe error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
}

module.exports = { register, login, getMe };
