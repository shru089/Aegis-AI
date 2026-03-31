// ═══════════════════════════════════════════════════════════════
//  🛡️  Aegis.AI Backend — server.js
//  Behavioral Threat Detection System Connector
//  Express + Socket.IO + Helmet + Rate Limiting
// ═══════════════════════════════════════════════════════════════

require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");
const { connectDB } = require("./config/db");

// ── Routes ───────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const graphRoutes = require("./routes/graph");
const alertRoutes = require("./routes/alerts");
const simulateRoutes = require("./routes/simulate");
const docsRoutes = require("./routes/docs");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ── Socket.IO for real-time alerts ───────────────────────
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Make io accessible from routes
app.set("io", io);

// Track connected clients
io.on("connection", (socket) => {
  console.log(`📡 Dashboard client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`📡 Dashboard client disconnected: ${socket.id}`);
  });
});

// ── Middleware ────────────────────────────────────────────

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — allow frontend
app.use(cors());

// JSON parsing
app.use(express.json());

// Request ID tracking (production-grade logging)
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

// HTTP logging
morgan.token("req-id", (req) => req.requestId?.slice(0, 8));
app.use(morgan(":method :url :status :res[content-length] - :response-time ms [:req-id]"));

// Global rate limiter (100 req/min per IP)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests",
    message: "Rate limit exceeded. Try again later.",
  },
});
app.use(globalLimiter);

// Stricter rate limit on auth endpoints (20 req/min per IP)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    error: "Too many login attempts",
    message: "Auth rate limit exceeded.",
  },
});

// ── Routes ───────────────────────────────────────────────
app.use("/auth", authLimiter, authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/graph-data", graphRoutes);
app.use("/alerts", alertRoutes);
app.use("/simulate", simulateRoutes);
app.use("/docs", docsRoutes);

// ── Health Check ─────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "running",
    service: "Aegis.AI Backend",
    version: "1.0.0",
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        "POST /auth/login": "Analyze login attempt behavior",
        "GET  /auth/blocked": "List blocked IPs",
      },
      dashboard: {
        "GET /dashboard": "Full dashboard data (stats, logs, alerts)",
      },
      graph: {
        "GET /graph-data": "Graph visualization data (nodes + links)",
      },
      alerts: {
        "GET /alerts": "High-risk activity alerts",
        "GET /alerts?level=attack": "Attack-only alerts",
      },
      simulate: {
        "POST /simulate/traffic": "Generate simulated traffic for demo",
      },
      docs: {
        "GET /docs": "API documentation",
      },
    },
  });
});

// ── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} does not exist`,
    available: "GET / for list of endpoints",
  });
});

// ── Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`❌ [${req.requestId?.slice(0, 8)}] Error:`, err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    requestId: req.requestId,
  });
});

// ── Start Server ─────────────────────────────────────────
async function startServer() {
  await connectDB();

  server.listen(PORT, () => {
    console.log("\n" + "═".repeat(55));
    console.log("  🛡️  AEGIS.AI BACKEND");
    console.log("═".repeat(55));
    console.log(`  🌐 Server:    http://localhost:${PORT}`);
    console.log(`  📡 WebSocket: ws://localhost:${PORT}`);
    console.log(`  🤖 ML API:    ${process.env.ML_API_URL || "http://localhost:8000"}`);
    console.log(`  💾 Storage:   ${process.env.USE_MONGO === "true" ? "MongoDB" : "In-Memory"}`);
    console.log(`  📄 Docs:      http://localhost:${PORT}/docs`);
    console.log("═".repeat(55) + "\n");
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err.message);
  process.exit(1);
});

module.exports = { app, server, io };
