const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

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
      `SELECT b.*, bus.reg_number, bus.route_name, bus.bus_type,
              s_board.stop_name AS board_stop, s_board.estimated_time AS board_time,
              s_drop.stop_name  AS drop_stop,  s_drop.estimated_time  AS drop_time
       FROM bookings b
       JOIN buses bus ON bus.id = b.bus_id
       JOIN bus_stops s_board ON s_board.id = b.board_stop_id
       JOIN bus_stops s_drop  ON s_drop.id  = b.drop_stop_id
       WHERE b.id = $1 AND b.booked_by = $2`,
      [id, req.user.id],
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const booking = bookingRes.rows[0];
    const passRes = await pool.query(
      "SELECT * FROM booking_passengers WHERE booking_id = $1",
      [id],
    );

    const doc = new PDFDocument({ margin: 40, size: "A5" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=SmartRouteLK-${id.substring(0, 8)}.pdf`,
    );
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill("#D0112B");
    doc
      .fillColor("white")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("SmartRoute LK", 40, 20);
    doc.fontSize(10).font("Helvetica").text("Your Bus Ticket", 40, 48);

    doc.fillColor("#1a1a1a").moveDown(3);

    // Booking details
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`${booking.board_stop} → ${booking.drop_stop}`, {
        align: "center",
      });
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666")
      .text(`${booking.reg_number} · ${booking.route_name}`, {
        align: "center",
      });
    doc.moveDown(0.5);
    doc
      .fillColor("#1a1a1a")
      .fontSize(11)
      .text(`Date: ${booking.travel_date.toISOString().split("T")[0]}`, {
        align: "center",
      })
      .text(
        `Departure: ${booking.board_time?.substring(0, 5)} → Arrival: ${booking.drop_time?.substring(0, 5)}`,
        { align: "center" },
      );

    doc.moveDown(1);

    // Per passenger QR codes
    for (const p of passRes.rows) {
      doc.addPage();

      // Passenger header
      doc.rect(0, 0, doc.page.width, 60).fill("#D0112B");
      doc
        .fillColor("white")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(p.passenger_name, 40, 15);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `Seat ${p.seat_number} · ${booking.board_stop} → ${booking.drop_stop}`,
          40,
          36,
        );

      doc.fillColor("#1a1a1a").moveDown(4);

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
      });

      const qrBuffer = await QRCode.toBuffer(qrData, {
        width: 180,
        margin: 2,
        color: { dark: "#D0112B", light: "#FFFFFF" },
      });

      doc.image(qrBuffer, (doc.page.width - 180) / 2, 80, { width: 180 });

      doc
        .fontSize(10)
        .fillColor("#666")
        .text(`Token: ${p.qr_token}`, { align: "center" })
        .moveDown(0.5)
        .text("Show this QR to the conductor when boarding.", {
          align: "center",
        })
        .text(`Valid for bus: ${booking.reg_number}`, { align: "center" });
    }

    doc.end();
  } catch (err) {
    console.error("PDF error:", err.message);
    res.status(500).json({ error: "Failed to generate PDF." });
  }
});

module.exports = router;
