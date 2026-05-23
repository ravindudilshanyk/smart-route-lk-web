const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { pool } = require("../config/db");

const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} = require("../controllers/bookingController");

// All booking routes require login
router.use(authMiddleware);

router.post("/", createBooking);
router.get("/mine", getMyBookings);
router.get("/:id", getBookingById);
router.patch("/:id/cancel", cancelBooking);

router.get("/:id/ticket-pdf", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const bookingRes = await pool.query(
      `SELECT b.*,
              bus.reg_number, bus.route_name, bus.bus_type,
              s_board.stop_name    AS board_stop,
              s_board.estimated_time AS board_time,
              s_drop.stop_name     AS drop_stop,
              s_drop.estimated_time  AS drop_time,
              u.first_name || ' ' || u.last_name AS passenger_name,
              u.whatsapp_number AS user_whatsapp,
              bo.whatsapp_alerts AS owner_whatsapp,
              uo.first_name || ' ' || uo.last_name AS owner_name
       FROM bookings b
       JOIN buses bus       ON bus.id = b.bus_id
       JOIN bus_stops s_board ON s_board.id = b.board_stop_id
       JOIN bus_stops s_drop  ON s_drop.id  = b.drop_stop_id
       JOIN users u         ON u.id = b.booked_by
       JOIN bus_owners bo   ON bo.id = bus.owner_id
       JOIN users uo        ON uo.id = bo.user_id
       WHERE b.id = $1 AND b.booked_by = $2`,
      [id, req.user.id],
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const booking = bookingRes.rows[0];

    const passRes = await pool.query(
      "SELECT * FROM booking_passengers WHERE booking_id = $1 ORDER BY seat_number",
      [id],
    );

    // ── Build PDF ─────────────────────────────────────
    const doc = new PDFDocument({ margin: 40, size: "A5" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=SmartRouteLK-${id.substring(0, 8)}.pdf`,
    );
    doc.pipe(res);

    // ── Cover page ────────────────────────────────────
    // Red header
    doc.rect(0, 0, doc.page.width, 90).fill("#D0112B");
    doc
      .fillColor("white")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("SmartRoute LK", 40, 20);
    doc.fontSize(10).font("Helvetica").text("Your official bus ticket", 40, 50);
    doc
      .fontSize(9)
      .text(`Booking ID: ${id.substring(0, 8).toUpperCase()}`, 40, 68);

    doc.fillColor("#1a1a1a").moveDown(4);

    // Journey details box
    doc
      .rect(30, 105, doc.page.width - 60, 90)
      .fill("#f9fafb")
      .stroke("#e5e7eb");

    doc
      .fillColor("#D0112B")
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`${booking.board_stop}  →  ${booking.drop_stop}`, 45, 118, {
        align: "center",
      });

    doc
      .fillColor("#6b7280")
      .fontSize(9)
      .font("Helvetica")
      .text(`${booking.reg_number}  ·  ${booking.route_name}`, {
        align: "center",
      });

    doc
      .fillColor("#1a1a1a")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`Date: ${new Date(booking.travel_date).toDateString()}`, 45, 155)
      .text(
        `Departs: ${booking.board_time?.substring(0, 5)}  →  Arrives: ${booking.drop_time?.substring(0, 5)}`,
        { continued: false },
      );

    doc.moveDown(2);

    // Passenger summary
    doc
      .fillColor("#1a1a1a")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`Passengers: ${passRes.rows.length}`, 40);
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#6b7280")
      .text(
        passRes.rows
          .map((p) => `${p.passenger_name} (Seat ${p.seat_number})`)
          .join("  ·  "),
        40,
      );

    doc.moveDown(1.5);

    // Payment info
    doc
      .fontSize(9)
      .fillColor("#1a1a1a")
      .text(
        `Total paid: ${parseFloat(booking.total_fare).toLocaleString()} LKR`,
        40,
      )
      .text(
        `Payment: ${booking.payment_method?.replace("_", " ")} · Status: ${booking.payment_status || booking.booking_status}`,
        40,
      );

    doc.moveDown(1.5);

    // ── Owner contact box ─────────────────────────────
    doc
      .rect(30, doc.y, doc.page.width - 60, 70)
      .fill("#fff7ed")
      .stroke("#fed7aa");

    const contactY = doc.y + 10;
    doc
      .fillColor("#9a3412")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Bus Owner Contact", 45, contactY);
    doc
      .fillColor("#7c2d12")
      .fontSize(9)
      .font("Helvetica")
      .text(`Owner: ${booking.owner_name}`, 45, contactY + 18)
      .text(
        `WhatsApp: ${booking.owner_whatsapp || "Contact via app"}`,
        45,
        contactY + 33,
      )
      .text(
        "Contact the owner for any journey-related queries.",
        45,
        contactY + 48,
      );

    doc.moveDown(5);

    // Footer
    doc
      .fillColor("#9ca3af")
      .fontSize(8)
      .text("This ticket is valid only for the journey and date shown above.", {
        align: "center",
      })
      .text("Show QR code to the conductor when boarding.", {
        align: "center",
      });

    // ── Per-passenger QR pages ────────────────────────
    for (const p of passRes.rows) {
      doc.addPage();

      // Header
      doc.rect(0, 0, doc.page.width, 70).fill("#D0112B");
      doc
        .fillColor("white")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(p.passenger_name, 40, 15);
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(
          `Seat ${p.seat_number}  ·  ${booking.board_stop} → ${booking.drop_stop}`,
          40,
          38,
        )
        .text(
          `${booking.reg_number}  ·  ${new Date(booking.travel_date).toDateString()}`,
          40,
          54,
        );

      // QR code
      const qrData = JSON.stringify({
        token: p.qr_token,
        booking_id: id,
        bus_id: booking.bus_id,
        passenger: p.passenger_name,
        seat: p.seat_number,
        board_stop: booking.board_stop,
        drop_stop: booking.drop_stop,
        valid_for_bus: booking.reg_number,
        travel_date: booking.travel_date,
      });

      const qrBuffer = await QRCode.toBuffer(qrData, {
        width: 200,
        margin: 2,
        color: { dark: "#D0112B", light: "#FFFFFF" },
        errorCorrectionLevel: "H",
      });

      doc.image(qrBuffer, (doc.page.width - 200) / 2, 90, { width: 200 });

      doc
        .fillColor("#6b7280")
        .fontSize(9)
        .font("Helvetica")
        .text(`Token: ${p.qr_token?.substring(0, 16)}...`, { align: "center" })
        .moveDown(0.5)
        .text("Show this QR to conductor when boarding.", { align: "center" })
        .text(`Valid for: ${booking.reg_number} only`, { align: "center" });

      // Contact on each ticket page
      doc.moveDown(1.5);
      doc
        .rect(30, doc.y, doc.page.width - 60, 55)
        .fill("#fff7ed")
        .stroke("#fed7aa");
      const cy = doc.y + 8;
      doc
        .fillColor("#9a3412")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Need help? Contact bus owner:", 45, cy);
      doc
        .fillColor("#7c2d12")
        .fontSize(9)
        .font("Helvetica")
        .text(
          `${booking.owner_name}  ·  WhatsApp: ${booking.owner_whatsapp || "N/A"}`,
          45,
          cy + 18,
        )
        .text(`Booking ID: ${id.substring(0, 8).toUpperCase()}`, 45, cy + 34);
    }

    doc.end();
  } catch (err) {
    console.error("PDF error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF." });
    }
  }
});

module.exports = router;
