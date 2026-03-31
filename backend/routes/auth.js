// ═══════════════════════════════════════════════════════════
//  Auth Route — Login Handling (UPGRADED)
//  Real-time WebSocket alerts + request tracking
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const { predict } = require("../services/mlService");
const store = require("../store/memoryStore");
const { checkBlockedIP, evaluateAndBlock } = require("../middleware/security");

/**
 * POST /auth/login
 *
 * Captures a login attempt, analyzes behavior via ML engine,
 * stores the log, and emits real-time alerts via WebSocket.
 *
 * Body:
 * {
 *   "user_id": "john_doe",
 *   "ip": "192.168.1.100",
 *   "time_gap": 0.3,
 *   "request_rate": 45,
 *   "same_ip": 8
 * }
 */
router.post("/login", checkBlockedIP, async (req, res) => {
  try {
    const { user_id, ip, time_gap, request_rate, same_ip } = req.body;

    // ── Validate input ──
    const errors = [];
    if (!user_id) errors.push("user_id is required");
    if (!ip) errors.push("ip is required");
    if (time_gap === undefined) errors.push("time_gap is required");
    if (request_rate === undefined) errors.push("request_rate is required");
    if (same_ip === undefined) errors.push("same_ip is required");

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
        expected_format: {
          user_id: "string",
          ip: "string (e.g. 192.168.1.1)",
          time_gap: "number (seconds between requests)",
          request_rate: "number (requests per minute)",
          same_ip: "number (repeated attempts from same IP)",
        },
      });
    }

    const tg = parseFloat(time_gap) || 0;
    const rr = parseFloat(request_rate) || 0;
    const si = parseInt(same_ip) || 0;

    // ── Send to ML Engine ──
    const startTime = Date.now();
    const mlResult = await predict(tg, rr, si);
    const latency = Date.now() - startTime;

    // ── Auto-block if score > 90 ──
    const wasBlocked = evaluateAndBlock(ip, mlResult.score);

    // ── Store log ──
    const logEntry = store.addLog({
      user_id,
      ip,
      time_gap: tg,
      request_rate: rr,
      same_ip: si,
      risk: mlResult.risk,
      score: mlResult.score,
      reasons: mlResult.reasons,
      blocked: wasBlocked,
    });

    // ── Real-time WebSocket alert ──
    const io = req.app.get("io");
    if (io) {
      // Always emit new log to dashboard
      io.emit("new_log", {
        log_id: logEntry._id,
        user_id,
        ip,
        risk: mlResult.risk,
        score: mlResult.score,
        reasons: mlResult.reasons,
        blocked: wasBlocked,
        timestamp: logEntry.createdAt,
      });

      // Emit alert for high-risk activity
      if (mlResult.risk === "Attack" || mlResult.risk === "Suspicious") {
        io.emit("threat_alert", {
          type: wasBlocked ? "bot_blocked" : "threat_detected",
          severity: mlResult.risk,
          user_id,
          ip,
          score: mlResult.score,
          reasons: mlResult.reasons,
          blocked: wasBlocked,
          timestamp: logEntry.createdAt,
        });

        // ── TASK: Demo Win Upgrade — Real Notifications ──
        const { sendAlert } = require("../services/notificationService");
        sendAlert({
          type: wasBlocked ? "bot_blocked" : "threat_detected",
          user_id,
          ip,
          score: mlResult.score,
          reasons: mlResult.reasons,
          blocked: wasBlocked,
        }).catch(() => {});
      }

      // Emit updated stats
      io.emit("stats_update", store.getStats());
    }

    // ── Response ──
    res.json({
      success: true,
      request_id: req.requestId,
      log_id: logEntry._id,
      user_id,
      ip,
      analysis: {
        risk: mlResult.risk,
        score: mlResult.score,
        reasons: mlResult.reasons,
      },
      blocked: wasBlocked,
      ml_latency_ms: latency,
      ...(mlResult._fallback && { warning: "ML engine offline — using fallback heuristics" }),
    });
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    res.status(500).json({
      error: "Internal server error",
      request_id: req.requestId,
      details: err.message,
    });
  }
});

/**
 * GET /auth/blocked
 * Returns list of currently blocked IPs
 */
router.get("/blocked", (req, res) => {
  const blockedIPs = store.getBlockedIPs();
  res.json({
    blocked_ips: blockedIPs,
    count: blockedIPs.length,
  });
});

module.exports = router;
