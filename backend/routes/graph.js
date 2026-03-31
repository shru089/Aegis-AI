// ═══════════════════════════════════════════════════════════
//  Graph Data API (UPGRADED)
//  Includes bot cluster detection
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const store = require("../store/memoryStore");
const { buildGraphData } = require("../utils/graphProcessor");

/**
 * GET /graph-data
 *
 * Returns graph-formatted data for frontend network visualization:
 * - nodes: unique IPs and users with risk levels
 * - links: login attempt connections with risk coloring
 * - clusters: detected bot clusters (IPs that attack same users)
 * - summary: aggregate stats
 */
router.get("/", (req, res) => {
  try {
    const logs = store.getAllLogs();
    const graphData = buildGraphData(logs);

    res.json(graphData);
  } catch (err) {
    console.error("❌ Graph data error:", err.message);
    res.status(500).json({ error: "Failed to build graph data" });
  }
});

module.exports = router;
