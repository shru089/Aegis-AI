// ═══════════════════════════════════════════════════════════
//  Graph Data Processor (UPGRADED)
//  Now includes bot cluster detection!
// ═══════════════════════════════════════════════════════════

/**
 * Convert behavior logs into graph-ready data with cluster detection.
 *
 * Nodes:
 *   - Unique IPs   (type: "ip", colored by risk)
 *   - Unique Users  (type: "user")
 *
 * Links:
 *   - Login attempts connecting users to IPs
 *   - Weighted by risk score, colored by risk level
 *
 * Clusters:
 *   - Groups of IPs that target the same user (potential botnets)
 *
 * @param {Array} logs - Array of log entries
 * @returns {Object} { nodes, links, clusters, summary }
 */
function buildGraphData(logs) {
  const nodeMap = new Map();
  const links = [];

  // Track IP → users mapping for cluster detection
  const ipToUsers = new Map();
  const userToIPs = new Map();

  for (const log of logs) {
    const userId = log.user_id;
    const ip = log.ip;

    // ── Build IP→User and User→IP maps ──
    if (!ipToUsers.has(ip)) ipToUsers.set(ip, new Set());
    ipToUsers.get(ip).add(userId);

    if (!userToIPs.has(userId)) userToIPs.set(userId, new Set());
    userToIPs.get(userId).add(ip);

    // ── Add user node ──
    if (!nodeMap.has(`user_${userId}`)) {
      nodeMap.set(`user_${userId}`, {
        id: `user_${userId}`,
        label: userId,
        type: "user",
        risk: "Safe",
        score: 0,
        connections: 0,
      });
    }

    // ── Add IP node ──
    if (!nodeMap.has(`ip_${ip}`)) {
      nodeMap.set(`ip_${ip}`, {
        id: `ip_${ip}`,
        label: ip,
        type: "ip",
        risk: "Safe",
        score: 0,
        blocked: false,
        connections: 0,
      });
    }

    // ── Update node risk to highest seen ──
    const userNode = nodeMap.get(`user_${userId}`);
    const ipNode = nodeMap.get(`ip_${ip}`);

    userNode.connections++;
    ipNode.connections++;

    if (riskPriority(log.risk) > riskPriority(userNode.risk)) {
      userNode.risk = log.risk;
      userNode.score = log.score;
    }
    if (riskPriority(log.risk) > riskPriority(ipNode.risk)) {
      ipNode.risk = log.risk;
      ipNode.score = log.score;
    }
    if (log.blocked) {
      ipNode.blocked = true;
    }

    // ── Add link ──
    links.push({
      source: `user_${userId}`,
      target: `ip_${ip}`,
      risk: log.risk,
      score: log.score,
      weight: riskPriority(log.risk) + 1,
      timestamp: log.createdAt,
    });
  }

  // ── Detect bot clusters ──
  const clusters = detectClusters(ipToUsers, userToIPs, nodeMap);

  const nodes = [...nodeMap.values()];

  return {
    nodes,
    links,
    clusters,
    summary: {
      total_nodes: nodes.length,
      total_links: links.length,
      unique_users: nodes.filter((n) => n.type === "user").length,
      unique_ips: nodes.filter((n) => n.type === "ip").length,
      attack_nodes: nodes.filter((n) => n.risk === "Attack").length,
      bot_clusters: clusters.length,
    },
  };
}

/**
 * Detect bot clusters — groups of IPs that target the same users.
 * A cluster is suspicious when multiple IPs hit the same user
 * or when one IP hits many users.
 */
function detectClusters(ipToUsers, userToIPs, nodeMap) {
  const clusters = [];

  // Pattern 1: Multiple IPs attacking same user (distributed botnet)
  for (const [userId, ips] of userToIPs.entries()) {
    if (ips.size >= 3) {
      const attackIPs = [...ips].filter((ip) => {
        const node = nodeMap.get(`ip_${ip}`);
        return node && (node.risk === "Attack" || node.risk === "Suspicious");
      });

      if (attackIPs.length >= 2) {
        clusters.push({
          type: "distributed_attack",
          description: `${attackIPs.length} IPs targeting user "${userId}"`,
          target_user: userId,
          ips: attackIPs,
          severity: "high",
        });
      }
    }
  }

  // Pattern 2: Single IP targeting many users (credential stuffing)
  for (const [ip, users] of ipToUsers.entries()) {
    if (users.size >= 3) {
      const node = nodeMap.get(`ip_${ip}`);
      if (node && node.risk !== "Safe") {
        clusters.push({
          type: "credential_stuffing",
          description: `IP ${ip} targeting ${users.size} different users`,
          ip,
          target_users: [...users],
          severity: users.size >= 5 ? "critical" : "medium",
        });
      }
    }
  }

  return clusters;
}

/**
 * Risk level priority for comparison.
 */
function riskPriority(risk) {
  const map = { Safe: 0, Suspicious: 1, Attack: 2 };
  return map[risk] || 0;
}

module.exports = { buildGraphData };
