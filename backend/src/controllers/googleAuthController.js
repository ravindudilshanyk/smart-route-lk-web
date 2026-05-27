const { pool } = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: `${user.first_name} ${user.last_name || ""}`,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );
}

async function googleAuth(req, res) {
  const { email, given_name, family_name, sub: google_id, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Google email is required." });
  }

  try {
    // 1. Check if user exists by email
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (existing.rows.length > 0) {
      const user = existing.rows[0];

      // Profile is complete only if all required fields are filled
      const profileComplete = !!(
        user.nic &&
        user.whatsapp_number &&
        user.date_of_birth &&
        user.gender
      );

      const token = generateToken(user);
      return res.json({
        message: "Login successful.",
        token,
        profile_complete: profileComplete,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // 2. New Google user - create with partial data only
    const firstName = given_name || (name ? name.split(" ")[0] : "User");
    const lastName =
      family_name || (name ? name.split(" ").slice(1).join(" ") : "");

    const randomPassword = uuidv4();
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(randomPassword, salt);

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, 'passenger', 'active')
       RETURNING id, first_name, last_name, email, role`,
      [firstName, lastName, email, password_hash],
    );

    const newUser = result.rows[0];
    const token = generateToken(newUser);

    return res.status(201).json({
      message: "Account created via Google.",
      token,
      profile_complete: false,
      user: {
        id: newUser.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(500).json({ error: "Server error during Google auth." });
  }
}

module.exports = { googleAuth };
