// ═══════════════════════════════════════════════════════════
//  Traffic Simulation Script (for demo)
//  Run: npm run simulate
//  Populates the backend with realistic mixed traffic
// ═══════════════════════════════════════════════════════════

const axios = require("axios");

const BASE_URL = "http://localhost:5000";

const colors = {
  g: "\x1b[32m", r: "\x1b[31m", y: "\x1b[33m",
  c: "\x1b[36m", b: "\x1b[1m", x: "\x1b[0m",
};

async function simulate() {
  console.log(`\n${colors.b}🛡️  Aegis.AI — Traffic Simulator${colors.x}\n`);

  try {
    // First, reset any existing data
    console.log("🔄 Resetting data...");
    await axios.delete(`${BASE_URL}/simulate/reset`);

    // Simulate mixed traffic
    console.log("📡 Generating 50 mixed traffic events...\n");
    const res = await axios.post(`${BASE_URL}/simulate/traffic?count=50&type=mixed`);

    const { summary, total_in_store } = res.data;
    console.log(`${colors.g}✅ Safe:       ${summary.safe}${colors.x}`);
    console.log(`${colors.y}⚠️  Suspicious: ${summary.suspicious}${colors.x}`);
    console.log(`${colors.r}🚨 Attack:     ${summary.attack}${colors.x}`);
    console.log(`${colors.r}🚫 Blocked:    ${summary.blocked}${colors.x}`);
    console.log(`\n📊 Total logs in store: ${total_in_store}`);

    // Fetch dashboard to show summary
    console.log("\n📋 Dashboard Summary:");
    const dash = await axios.get(`${BASE_URL}/dashboard`);
    const { stats, top_attackers, top_targets } = dash.data;
    console.log(`   Avg Risk Score: ${stats.avg_risk_score}`);
    console.log(`   Max Risk Score: ${stats.max_risk_score}`);
    console.log(`   Unique IPs:    ${stats.unique_ips}`);
    console.log(`   Blocked IPs:   ${stats.blocked_ips_count}`);

    if (top_attackers?.length) {
      console.log("\n🎯 Top Attackers:");
      top_attackers.forEach((a) => console.log(`   ${a.ip} → ${a.attack_count} attacks`));
    }

    // Fetch graph data
    const graph = await axios.get(`${BASE_URL}/graph-data`);
    console.log(`\n🕸️  Graph Data:`);
    console.log(`   Nodes: ${graph.data.summary.total_nodes}`);
    console.log(`   Links: ${graph.data.summary.total_links}`);
    console.log(`   Bot Clusters: ${graph.data.summary.bot_clusters}`);

    if (graph.data.clusters?.length) {
      console.log("\n🔍 Detected Clusters:");
      graph.data.clusters.forEach((c) => {
        console.log(`   [${c.severity.toUpperCase()}] ${c.type}: ${c.description}`);
      });
    }

    console.log(`\n${colors.b}✅ Simulation complete! Dashboard is ready for demo.${colors.x}\n`);
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    console.error("Make sure the server is running: npm run dev\n");
  }
}

simulate();
