// ═══════════════════════════════════════════════════════════
//  In-Memory Store (UPGRADED)
//  Thread-safe, with TTL tracking and better queries
// ═══════════════════════════════════════════════════════════

const logs = [];
const blockedIPs = new Map(); // IP → { blockedAt, reason, score }

const { getGeoFromIP } = require("../utils/geoIP");

const store = {
  // ── Logs ──────────────────────────────────────────────
  addLog(entry) {
    const geo = getGeoFromIP(entry.ip);
    const log = {
      ...entry,
      _id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      createdAt: new Date().toISOString(),
      country_code: geo.country_code,
      country_name: geo.country_name,
    };
    logs.push(log);
    return log;
  },

  getAllLogs() {
    return [...logs].reverse(); // newest first
  },

  getRecentLogs(limit = 50) {
    return [...logs].reverse().slice(0, limit);
  },

  getLogsByRisk(risk) {
    return logs.filter((l) => l.risk === risk).reverse();
  },

  getLogsByIP(ip) {
    return logs.filter((l) => l.ip === ip).reverse();
  },

  getLogsByUser(userId) {
    return logs.filter((l) => l.user_id === userId).reverse();
  },

  getLogById(id) {
    return logs.find((l) => l._id === id) || null;
  },

  // ── Blocked IPs ───────────────────────────────────────
  blockIP(ip, score = 0) {
    blockedIPs.set(ip, {
      blockedAt: new Date().toISOString(),
      reason: "Auto-blocked: risk score exceeded threshold",
      score,
    });
  },

  unblockIP(ip) {
    blockedIPs.delete(ip);
  },

  isBlocked(ip) {
    return blockedIPs.has(ip);
  },

  getBlockedIPs() {
    return [...blockedIPs.keys()];
  },

  getBlockedIPsDetailed() {
    const result = [];
    for (const [ip, info] of blockedIPs.entries()) {
      result.push({ ip, ...info });
    }
    return result;
  },

  // ── Stats ─────────────────────────────────────────────
  getStats() {
    const total = logs.length;
    const safe = logs.filter((l) => l.risk === "Safe").length;
    const suspicious = logs.filter((l) => l.risk === "Suspicious").length;
    const attacks = logs.filter((l) => l.risk === "Attack").length;
    const blocked = logs.filter((l) => l.blocked).length;

    const scores = logs.map((l) => l.score || 0);
    const avgScore = total > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;
    const maxScore = total > 0 ? Math.max(...scores) : 0;

    return {
      total_requests: total,
      safe_count: safe,
      suspicious_count: suspicious,
      attack_count: attacks,
      blocked_requests: blocked,
      blocked_ips_count: blockedIPs.size,
      avg_risk_score: avgScore,
      max_risk_score: maxScore,
      unique_ips: new Set(logs.map((l) => l.ip)).size,
      unique_users: new Set(logs.map((l) => l.user_id)).size,
    };
  },

  // ── Clear (for testing/demo reset) ────────────────────
  clear() {
    logs.length = 0;
    blockedIPs.clear();
  },
};

module.exports = store;
