// ═══════════════════════════════════════════════════════════
//  Simulate Route — Generate Demo Traffic
//  Essential for hackathon demo! Populates data instantly.
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const { predict } = require("../services/mlService");
const store = require("../store/memoryStore");
const { evaluateAndBlock } = require("../middleware/security");

// ── Realistic simulation data ────────────────────────────
const NORMAL_USERS = [
  { user_id: "alice_dev", ip: "192.168.1.10" },
  { user_id: "bob_smith", ip: "192.168.1.22" },
  { user_id: "carol_jones", ip: "10.0.0.5" },
  { user_id: "david_lee", ip: "172.16.0.15" },
  { user_id: "emma_wilson", ip: "192.168.2.100" },
];

const SUSPICIOUS_USERS = [
  { user_id: "unknown_42", ip: "85.120.33.44" },
  { user_id: "temp_user", ip: "91.200.12.8" },
];

const BOT_ATTACKERS = [
  { user_id: "admin", ip: "45.33.22.11" },
  { user_id: "root", ip: "45.33.22.11" },
  { user_id: "admin", ip: "103.55.88.99" },
  { user_id: "test", ip: "198.51.100.7" },
  { user_id: "administrator", ip: "45.33.22.11" },
  { user_id: "admin", ip: "203.0.113.42" },
];

/**
 * POST /simulate/traffic
 *
 * Generate simulated traffic for demo purposes.
 * Query params:
 *   ?count=50  → number of events (default: 30)
 *   ?type=mixed → mixed | normal | attack
 */
router.post("/traffic", async (req, res) => {
  try {
    const count = Math.min(parseInt(req.query.count) || 30, 200);
    const type = req.query.type || "mixed";

    const results = [];
    const io = req.app.get("io");

    for (let i = 0; i < count; i++) {
      let user, behavior;

      if (type === "normal") {
        ({ user, behavior } = generateNormalBehavior());
      } else if (type === "attack") {
        ({ user, behavior } = generateAttackBehavior());
      } else {
        // Mixed: 60% normal, 15% suspicious, 25% attack
        const roll = Math.random();
        if (roll < 0.6) {
          ({ user, behavior } = generateNormalBehavior());
        } else if (roll < 0.75) {
          ({ user, behavior } = generateSuspiciousBehavior());
        } else {
          ({ user, behavior } = generateAttackBehavior());
        }
      }

      // Get ML prediction (or fallback)
      const mlResult = await predict(behavior.time_gap, behavior.request_rate, behavior.same_ip);

      // Check for auto-block
      const wasBlocked = evaluateAndBlock(user.ip, mlResult.score);

      // Store log
      const logEntry = store.addLog({
        user_id: user.user_id,
        ip: user.ip,
        time_gap: behavior.time_gap,
        request_rate: behavior.request_rate,
        same_ip: behavior.same_ip,
        risk: mlResult.risk,
        score: mlResult.score,
        reasons: mlResult.reasons,
        blocked: wasBlocked,
      });

      // WebSocket real-time update
      if (io) {
        io.emit("new_log", {
          log_id: logEntry._id,
          user_id: user.user_id,
          ip: user.ip,
          risk: mlResult.risk,
          score: mlResult.score,
          reasons: mlResult.reasons,
          blocked: wasBlocked,
          timestamp: logEntry.createdAt,
        });

        if (mlResult.risk !== "Safe") {
          io.emit("threat_alert", {
            type: wasBlocked ? "bot_blocked" : "threat_detected",
            severity: mlResult.risk,
            user_id: user.user_id,
            ip: user.ip,
            score: mlResult.score,
            reasons: mlResult.reasons,
            blocked: wasBlocked,
            timestamp: logEntry.createdAt,
          });
        }
      }

      results.push({
        user_id: user.user_id,
        ip: user.ip,
        risk: mlResult.risk,
        score: mlResult.score,
        blocked: wasBlocked,
      });
    }

    // Send final stats update
    if (io) {
      io.emit("stats_update", store.getStats());
    }

    const summary = {
      safe: results.filter((r) => r.risk === "Safe").length,
      suspicious: results.filter((r) => r.risk === "Suspicious").length,
      attack: results.filter((r) => r.risk === "Attack").length,
      blocked: results.filter((r) => r.blocked).length,
    };

    res.json({
      success: true,
      simulated: count,
      summary,
      total_in_store: store.getStats().total_requests,
    });
  } catch (err) {
    console.error("❌ Simulation error:", err.message);
    res.status(500).json({ error: "Simulation failed", details: err.message });
  }
});

/**
 * DELETE /simulate/reset
 * Clear all data (for fresh demo)
 */
router.delete("/reset", (req, res) => {
  store.clear();
  const io = req.app.get("io");
  if (io) {
    io.emit("stats_update", store.getStats());
  }
  res.json({ success: true, message: "All data cleared" });
});

// ── Behavior generators ──────────────────────────────────

function generateNormalBehavior() {
  const user = NORMAL_USERS[Math.floor(Math.random() * NORMAL_USERS.length)];
  return {
    user,
    behavior: {
      time_gap: +(Math.random() * 25 + 3).toFixed(2),      // 3-28s
      request_rate: +(Math.random() * 12 + 1).toFixed(1),   // 1-13 req/min
      same_ip: Math.floor(Math.random() * 3) + 1,           // 1-3
    },
  };
}

function generateSuspiciousBehavior() {
  const user = SUSPICIOUS_USERS[Math.floor(Math.random() * SUSPICIOUS_USERS.length)];
  return {
    user,
    behavior: {
      time_gap: +(Math.random() * 1.5 + 0.5).toFixed(2),    // 0.5-2s
      request_rate: +(Math.random() * 20 + 15).toFixed(1),   // 15-35 req/min
      same_ip: Math.floor(Math.random() * 5) + 3,            // 3-7
    },
  };
}

function generateAttackBehavior() {
  const user = BOT_ATTACKERS[Math.floor(Math.random() * BOT_ATTACKERS.length)];
  return {
    user,
    behavior: {
      time_gap: +(Math.random() * 0.4 + 0.01).toFixed(3),     // 0.01-0.41s
      request_rate: +(Math.random() * 150 + 40).toFixed(1),    // 40-190 req/min
      same_ip: Math.floor(Math.random() * 40) + 8,             // 8-47
    },
  };
}

module.exports = router;
