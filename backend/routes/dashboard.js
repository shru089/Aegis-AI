// ═══════════════════════════════════════════════════════════
//  Dashboard API (UPGRADED)
//  Returns comprehensive dashboard data with trends
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const store = require("../store/memoryStore");
const { healthCheck } = require("../services/mlService");

/**
 * GET /dashboard
 *
 * Returns full dashboard payload:
 * - stats: aggregate counts & averages
 * - recent_logs: last N log entries
 * - alerts: high-risk activities
 * - risk_breakdown: percentage distribution
 * - timeline: activity over time
 * - ml_status: ML engine health
 * - blocked_ips: currently blocked IPs
 */
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const stats = store.getStats();
    const recentLogs = store.getRecentLogs(limit);
    const allLogs = store.getAllLogs();
    const mlStatus = await healthCheck();

    // Risk breakdown (percentages)
    const total = stats.total_requests || 1;
    const riskBreakdown = {
      safe: {
        count: stats.safe_count,
        percent: Math.round((stats.safe_count / total) * 100),
      },
      suspicious: {
        count: stats.suspicious_count,
        percent: Math.round((stats.suspicious_count / total) * 100),
      },
      attack: {
        count: stats.attack_count,
        percent: Math.round((stats.attack_count / total) * 100),
      },
    };

    // Timeline: group logs by minute for activity chart
    const timeline = buildTimeline(allLogs);

    // Top targeted users
    const topTargets = getTopTargets(allLogs, 5);

    // Top attacking IPs
    const topAttackers = getTopAttackers(allLogs, 5);

    // Recent alerts only
    const alerts = recentLogs
      .filter((l) => l.risk === "Attack" || l.risk === "Suspicious")
      .map((a) => ({
        log_id: a._id,
        user_id: a.user_id,
        ip: a.ip,
        risk: a.risk,
        score: a.score,
        reasons: a.reasons,
        blocked: a.blocked,
        timestamp: a.createdAt,
      }));

    res.json({
      stats,
      risk_breakdown: riskBreakdown,
      recent_logs: recentLogs,
      alerts,
      timeline,
      top_targets: topTargets,
      top_attackers: topAttackers,
      ml_engine: mlStatus,
      blocked_ips: store.getBlockedIPs(),
    });
  } catch (err) {
    console.error("❌ Dashboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

/**
 * Build activity timeline grouped by minute.
 */
function buildTimeline(logs) {
  const buckets = {};
  for (const log of logs) {
    const minute = log.createdAt?.slice(0, 16) || "unknown"; // YYYY-MM-DDTHH:MM
    if (!buckets[minute]) {
      buckets[minute] = { time: minute, safe: 0, suspicious: 0, attack: 0, total: 0 };
    }
    buckets[minute].total++;
    if (log.risk === "Safe") buckets[minute].safe++;
    else if (log.risk === "Suspicious") buckets[minute].suspicious++;
    else if (log.risk === "Attack") buckets[minute].attack++;
  }
  return Object.values(buckets).sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Get most targeted user IDs.
 */
function getTopTargets(logs, limit = 5) {
  const counts = {};
  for (const log of logs) {
    if (log.risk !== "Safe") {
      counts[log.user_id] = (counts[log.user_id] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([user_id, count]) => ({ user_id, threat_count: count }));
}

/**
 * Get top attacking IPs.
 */
function getTopAttackers(logs, limit = 5) {
  const counts = {};
  for (const log of logs) {
    if (log.risk === "Attack") {
      counts[log.ip] = (counts[log.ip] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([ip, count]) => ({ ip, attack_count: count }));
}

module.exports = router;
