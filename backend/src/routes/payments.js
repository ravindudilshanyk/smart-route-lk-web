const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { pool } = require("../config/db");
const authMiddleware = require("../middleware/auth");

const PAYHERE_MERCHANT_ID =
  process.env.PAYHERE_MERCHANT_ID || "YOUR_MERCHANT_ID";
const PAYHERE_SECRET = process.env.PAYHERE_SECRET || "YOUR_SECRET";
const PAYHERE_BASE =
  process.env.NODE_ENV === "production"
    ? "https://www.payhere.lk"
    : "https://sandbox.payhere.lk";

// Generate payment hash
function generateHash(merchantId, orderId, amount, currency, secret) {
  const hashedSecret = crypto
    .createHash("md5")
    .update(secret)
    .digest("hex")
    .toUpperCase();
  const str = `${merchantId}${orderId}${amount}${currency}${hashedSecret}`;
  return crypto.createHash("md5").update(str).digest("hex").toUpperCase();
}

// ── Initiate payment ────────────────────────────────
router.post("/initiate", authMiddleware, async (req, res) => {
  const { booking_ids, total_amount, passenger_name, whatsapp } = req.body;

  if (!booking_ids || !total_amount) {
    return res
      .status(400)
      .json({ error: "booking_ids and total_amount required." });
  }

  const orderId = `SR-${Date.now()}-${req.user.id.substring(0, 8)}`;
  const amount = parseFloat(total_amount).toFixed(2);
  const currency = "LKR";
  const hash = generateHash(
    PAYHERE_MERCHANT_ID,
    orderId,
    amount,
    currency,
    PAYHERE_SECRET,
  );

  // NOTE: temporary debug logging was removed. Keep secret values out of logs.

  try {
    // Store payment intent
    await pool.query(
      `INSERT INTO payment_intents (order_id, user_id, booking_ids, amount, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (order_id) DO NOTHING`,
      [orderId, req.user.id, JSON.stringify(booking_ids), total_amount],
    );

    res.json({
      merchant_id: PAYHERE_MERCHANT_ID,
      order_id: orderId,
      amount,
      currency,
      hash,
      payhere_url: `${PAYHERE_BASE}/pay/checkout`,
      return_url: `${process.env.FRONTEND_URL}/payment/success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      notify_url: `${process.env.BACKEND_URL}/api/payments/notify`,
      first_name: passenger_name?.split(" ")[0] || "Passenger",
      last_name: passenger_name?.split(" ").slice(1).join(" ") || "",
      phone: whatsapp || "",
      email: req.user.email || "noreply@smartroutelk.com",
      items: "SmartRoute LK Bus Ticket",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to initiate payment." });
  }
});

// ── PayHere payment notification (webhook) ──────────
router.post("/notify", async (req, res) => {
  const {
    merchant_id,
    order_id,
    payment_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig,
  } = req.body;

  // Verify signature
  const hashedSecret = crypto
    .createHash("md5")
    .update(PAYHERE_SECRET)
    .digest("hex")
    .toUpperCase();
  const expected = crypto
    .createHash("md5")
    .update(
      `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${hashedSecret}`,
    )
    .digest("hex")
    .toUpperCase();

  if (expected !== md5sig) {
    return res.status(400).json({ error: "Invalid signature." });
  }

  if (status_code !== "2") {
    // 2 = success
    return res.json({ message: "Payment not successful." });
  }

  try {
    // Get booking IDs from payment intent
    const intentRes = await pool.query(
      "SELECT booking_ids FROM payment_intents WHERE order_id = $1",
      [order_id],
    );

    if (intentRes.rows.length === 0) {
      return res.status(404).json({ error: "Payment intent not found." });
    }

    const bookingIds = JSON.parse(intentRes.rows[0].booking_ids);

    // Update all bookings to confirmed
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const bookingId of bookingIds) {
        await client.query(
          `UPDATE bookings SET
            booking_status = 'confirmed',
            payment_status = 'paid',
            payment_reference = $1,
            paid_at = NOW()
           WHERE id = $2`,
          [payment_id, bookingId],
        );
      }

      await client.query(
        "UPDATE payment_intents SET status = 'completed', payment_id = $1 WHERE order_id = $2",
        [payment_id, order_id],
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    res.json({ message: "Payment processed." });
  } catch (err) {
    console.error("Payment notify error:", err.message);
    res.status(500).json({ error: "Server error." });
  }
});

// ── Check payment status ─────────────────────────────
router.get("/status/:orderId", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT status, payment_id FROM payment_intents WHERE order_id = $1 AND user_id = $2",
      [req.params.orderId, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
