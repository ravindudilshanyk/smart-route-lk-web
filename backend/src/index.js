require("dotenv").config();

const authRoutes = require("./routes/auth");
const ownerRoutes = require("./routes/owners");
const busRoutes = require("./routes/buses");
const searchRoutes = require("./routes/search");
const bookingRoutes = require("./routes/bookings");
const userRoutes = require("./routes/users");
const seatRoutes = require("./routes/seats");

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connectDB } = require("./config/db");
const logger = require("./utils/logger");

const app = express();
const server = http.createServer(app);

// ── Middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/owners", ownerRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/seats", seatRoutes);

// ── Health check route ──────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "SmartRoute LK API is running",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ─────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

// ── Start server ─────────────────────────────────────
async function start() {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    logger.info(`SmartRoute LK backend running → http://localhost:${PORT}`);
  });
}

start();
