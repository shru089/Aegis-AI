// ═══════════════════════════════════════════════════════════
//  Security Middleware (UPGRADED)
//  Auto-blocks IPs with score > 90
//  Tracks block metadata
// ═══════════════════════════════════════════════════════════

const store = require("../store/memoryStore");

/**
 * Middleware: Check if incoming IP is blocked.
 * If blocked, reject with 403 and "Bot Blocked" alert.
 */
function checkBlockedIP(req, res, next) {
  const ip = req.body?.ip || req.ip || req.headers["x-forwarded-for"] || "unknown";

  if (store.isBlocked(ip)) {
    // Emit WebSocket alert for blocked attempt
    const io = req.app.get("io");
    if (io) {
      io.emit("threat_alert", {
        type: "blocked_attempt",
        severity: "Attack",
        ip,
        message: `Blocked IP ${ip} attempted access`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(403).json({
      error: "Bot Blocked",
      message: `IP ${ip} has been blocked due to malicious activity.`,
      alert: {
        type: "bot_blocked",
        ip,
        timestamp: new Date().toISOString(),
      },
    });
  }

  next();
}

/**
 * Process ML result and auto-block if score > 90.
 */
function evaluateAndBlock(ip, score) {
  if (score > 90) {
    store.blockIP(ip, score);
    console.log(`🚫 Auto-blocked IP: ${ip} (score: ${score})`);
    return true;
  }
  return false;
}

module.exports = { checkBlockedIP, evaluateAndBlock };
