require("dotenv").config();

const authRoutes = require("./routes/auth");
const ownerRoutes = require("./routes/owners");
const busRoutes = require("./routes/buses");
const searchRoutes = require("./routes/search");
const bookingRoutes = require("./routes/bookings");
const userRoutes = require("./routes/users");
const seatRoutes = require("./routes/seats");
const adminRoutes = require("./routes/admin");
const conductorRoutes = require("./routes/conductor");
const paymentRoutes = require("./routes/payments");
const conductorsRoutes = require("./routes/conductors");

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
app.use("/api/admin", adminRoutes);
app.use("/api/conductor", conductorRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/conductors", conductorRoutes);

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

// ── Socket.IO real-time tracking ─────────────────────
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
    credentials: true,
  },
});

// Store active bus locations in memory
const busLocations = {};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Conductor broadcasts location
  socket.on("update_location", async (data) => {
    const { bus_id, latitude, longitude } = data;
    busLocations[bus_id] = { latitude, longitude, updated_at: new Date() };
    // Broadcast to all tracking this bus
    io.to(`bus_${bus_id}`).emit("bus_location", {
      latitude,
      longitude,
      bus_info: data.bus_info || {},
    });
  });

  // Passenger subscribes to bus tracking
  socket.on("track_bus", (data) => {
    socket.join(`bus_${data.bus_id}`);
    // Send last known location immediately if available
    if (busLocations[data.bus_id]) {
      socket.emit("bus_location", busLocations[data.bus_id]);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
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
