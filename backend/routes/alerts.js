// ═══════════════════════════════════════════════════════════
//  Task 6: Alerts API
//  GET /alerts → Returns high-risk activity
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const store = require("../store/memoryStore");

/**
 * GET /alerts
 *
 * Returns all high-risk entries (Attack + Suspicious).
 * Query params:
 *   ?level=attack  → only Attack level
 *   ?level=suspicious → only Suspicious level
 *   ?limit=20 → limit results
 */
router.get("/", (req, res) => {
  try {
    const { level, limit } = req.query;
    let logs = store.getAllLogs();

    // Filter by risk level
    if (level === "attack") {
      logs = logs.filter((l) => l.risk === "Attack");
    } else if (level === "suspicious") {
      logs = logs.filter((l) => l.risk === "Suspicious");
    } else {
      // Default: return Attack + Suspicious
      logs = logs.filter((l) => l.risk === "Attack" || l.risk === "Suspicious");
    }

    // Apply limit
    const maxResults = parseInt(limit) || 100;
    logs = logs.slice(0, maxResults);

    res.json({
      total: logs.length,
      alerts: logs.map((l) => ({
        log_id: l._id,
        user_id: l.user_id,
        ip: l.ip,
        risk: l.risk,
        score: l.score,
        reasons: l.reasons,
        blocked: l.blocked,
        timestamp: l.createdAt,
      })),
    });
  } catch (err) {
    console.error("❌ Alerts error:", err.message);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

module.exports = router;
