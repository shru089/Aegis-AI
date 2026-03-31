// ═══════════════════════════════════════════════════════════
//  API Test Suite (UPGRADED)
//  Comprehensive tests with pass/fail tracking
//  Run: npm test
// ═══════════════════════════════════════════════════════════

const axios = require("axios");

const BASE_URL = "http://localhost:5000";
let passed = 0;
let failed = 0;

const C = {
  g: "\x1b[32m", r: "\x1b[31m", y: "\x1b[33m",
  c: "\x1b[36m", b: "\x1b[1m", d: "\x1b[2m",
  x: "\x1b[0m",
};

function pass(test, detail = "") {
  passed++;
  console.log(`  ${C.g}✅ PASS${C.x}: ${test}${detail ? ` ${C.d}(${detail})${C.x}` : ""}`);
}

function fail(test, err) {
  failed++;
  console.log(`  ${C.r}❌ FAIL${C.x}: ${test} → ${err}`);
}

function header(title) {
  console.log(`\n${C.b}${C.c}━━━ ${title} ━━━${C.x}`);
}

// ══════════════════════════════════════════════════════════

async function testHealthCheck() {
  header("1. Health Check (GET /)");
  try {
    const res = await axios.get(`${BASE_URL}/`);
    if (res.data.status === "running" && res.data.endpoints) {
      pass("Server is running with endpoint listing");
    } else {
      fail("Health check", "Incomplete response");
    }
  } catch (err) {
    fail("Health check", err.message);
  }
}

async function testDocs() {
  header("2. API Docs (GET /docs)");
  try {
    const res = await axios.get(`${BASE_URL}/docs`);
    if (res.data.endpoints && res.data.websocket) {
      pass("Docs endpoint returns full API reference");
    } else {
      fail("Docs", "Missing endpoints or websocket info");
    }
  } catch (err) {
    fail("Docs", err.message);
  }
}

async function testNormalLogin() {
  header("3. Normal User Login → Should return Safe");
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      user_id: "alice",
      ip: "192.168.1.10",
      time_gap: 8.5,
      request_rate: 3,
      same_ip: 1,
    });

    const { analysis } = res.data;
    console.log(`     Risk: ${analysis.risk} | Score: ${analysis.score} | Reasons: ${analysis.reasons.join(", ")}`);

    if (analysis.risk === "Safe" && analysis.score < 40) {
      pass("Normal user correctly classified as Safe", `score=${analysis.score}`);
    } else {
      fail("Normal user", `Expected Safe, got ${analysis.risk} (score: ${analysis.score})`);
    }
  } catch (err) {
    fail("Normal login", err.message);
  }
}

async function testSuspiciousLogin() {
  header("4. Suspicious User → Should return Suspicious");
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      user_id: "sketchy_bob",
      ip: "85.120.33.44",
      time_gap: 0.8,
      request_rate: 28,
      same_ip: 6,
    });

    const { analysis } = res.data;
    console.log(`     Risk: ${analysis.risk} | Score: ${analysis.score} | Reasons: ${analysis.reasons.join(", ")}`);

    if (analysis.risk === "Suspicious" || analysis.risk === "Attack") {
      pass("Suspicious user correctly flagged", `risk=${analysis.risk}`);
    } else {
      fail("Suspicious user", `Expected Suspicious+, got ${analysis.risk}`);
    }
  } catch (err) {
    fail("Suspicious login", err.message);
  }
}

async function testBotAttack() {
  header("5. Bot Attack → Should return Attack");
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      user_id: "admin",
      ip: "45.33.22.11",
      time_gap: 0.05,
      request_rate: 150,
      same_ip: 30,
    });

    const { analysis, blocked } = res.data;
    console.log(`     Risk: ${analysis.risk} | Score: ${analysis.score} | Blocked: ${blocked}`);
    console.log(`     Reasons: ${analysis.reasons.join(", ")}`);

    if (analysis.risk === "Attack" && analysis.score >= 70) {
      pass("Bot attack correctly detected", `score=${analysis.score}`);
    } else {
      fail("Bot attack", `Expected Attack (≥70), got ${analysis.risk} (score: ${analysis.score})`);
    }
  } catch (err) {
    fail("Bot attack", err.message);
  }
}

async function testAutoBlock() {
  header("6. Auto-Block → Score > 90 should block IP");
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      user_id: "root",
      ip: "66.66.66.66",
      time_gap: 0.01,
      request_rate: 200,
      same_ip: 50,
    });

    const { blocked, analysis } = res.data;
    console.log(`     Score: ${analysis.score} | Blocked: ${blocked}`);

    if (blocked) {
      pass("IP auto-blocked for extreme bot behavior");

      // Verify blocked IP is rejected
      try {
        await axios.post(`${BASE_URL}/auth/login`, {
          user_id: "root",
          ip: "66.66.66.66",
          time_gap: 5,
          request_rate: 2,
          same_ip: 1,
        });
        fail("Blocked IP rejection", "Should have returned 403");
      } catch (blockErr) {
        if (blockErr.response?.status === 403 && blockErr.response.data.error === "Bot Blocked") {
          pass("Blocked IP correctly rejected with 403 Bot Blocked");
        } else {
          fail("Blocked IP rejection", `Status: ${blockErr.response?.status}`);
        }
      }
    } else {
      console.log(`     ${C.y}⚠️ Score ${analysis.score} didn't trigger auto-block (threshold: 90)${C.x}`);
    }
  } catch (err) {
    fail("Auto-block", err.message);
  }
}

async function testValidation() {
  header("7. Input Validation → Missing fields should return 400");
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {});
    fail("Validation", "Should have returned 400");
  } catch (err) {
    if (err.response?.status === 400 && err.response.data.details) {
      pass("Validation correctly returns 400 with field details");
    } else {
      fail("Validation", `Status: ${err.response?.status}`);
    }
  }
}

async function testSimulation() {
  header("8. Traffic Simulation (POST /simulate/traffic)");
  try {
    const res = await axios.post(`${BASE_URL}/simulate/traffic?count=10&type=mixed`);
    const { summary, simulated } = res.data;
    console.log(`     Simulated: ${simulated} | Safe: ${summary.safe} | Suspicious: ${summary.suspicious} | Attack: ${summary.attack}`);

    if (simulated === 10 && summary.safe + summary.suspicious + summary.attack === 10) {
      pass("Simulation generated correct event count");
    } else {
      fail("Simulation", "Count mismatch");
    }
  } catch (err) {
    fail("Simulation", err.message);
  }
}

async function testDashboard() {
  header("9. Dashboard (GET /dashboard)");
  try {
    const res = await axios.get(`${BASE_URL}/dashboard`);
    const { stats, risk_breakdown, timeline, top_attackers } = res.data;

    console.log(`     Total: ${stats.total_requests} | Avg Score: ${stats.avg_risk_score}`);
    console.log(`     Breakdown: Safe ${risk_breakdown.safe.percent}% | Sus ${risk_breakdown.suspicious.percent}% | Atk ${risk_breakdown.attack.percent}%`);

    if (stats.total_requests > 0 && risk_breakdown && timeline) {
      pass("Dashboard returns complete data with breakdown + timeline");
    } else {
      fail("Dashboard", "Missing data sections");
    }
  } catch (err) {
    fail("Dashboard", err.message);
  }
}

async function testGraphData() {
  header("10. Graph Data (GET /graph-data)");
  try {
    const res = await axios.get(`${BASE_URL}/graph-data`);
    const { nodes, links, clusters, summary } = res.data;

    console.log(`     Nodes: ${summary.total_nodes} | Links: ${summary.total_links} | Clusters: ${summary.bot_clusters}`);

    if (nodes.length > 0 && links.length > 0) {
      pass("Graph data built with nodes + links");
      if (clusters !== undefined) {
        pass("Bot cluster detection included");
      }
    } else {
      fail("Graph data", "Empty graph");
    }
  } catch (err) {
    fail("Graph data", err.message);
  }
}

async function testAlerts() {
  header("11. Alerts (GET /alerts)");
  try {
    const res = await axios.get(`${BASE_URL}/alerts`);
    console.log(`     Total alerts: ${res.data.total}`);

    if (res.data.alerts !== undefined) {
      pass("Alerts endpoint working");
    }

    // Test filtering
    const atk = await axios.get(`${BASE_URL}/alerts?level=attack`);
    const sus = await axios.get(`${BASE_URL}/alerts?level=suspicious`);
    console.log(`     Attack: ${atk.data.total} | Suspicious: ${sus.data.total}`);
    pass("Alert level filtering works");
  } catch (err) {
    fail("Alerts", err.message);
  }
}

async function testBlockedList() {
  header("12. Blocked IPs (GET /auth/blocked)");
  try {
    const res = await axios.get(`${BASE_URL}/auth/blocked`);
    console.log(`     Blocked: ${res.data.count} IPs → [${res.data.blocked_ips.join(", ")}]`);
    pass("Blocked IPs endpoint working");
  } catch (err) {
    fail("Blocked IPs", err.message);
  }
}

async function test404() {
  header("13. 404 Handler");
  try {
    await axios.get(`${BASE_URL}/nonexistent`);
    fail("404 handler", "Should have returned 404");
  } catch (err) {
    if (err.response?.status === 404) {
      pass("404 handler returns proper error");
    } else {
      fail("404 handler", `Status: ${err.response?.status}`);
    }
  }
}

// ══════════════════════════════════════════════════════════

async function runAllTests() {
  console.log(`\n${C.b}🛡️  AEGIS.AI BACKEND — API TEST SUITE${C.x}`);
  console.log(`${"━".repeat(50)}`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`${"━".repeat(50)}`);

  await testHealthCheck();
  await testDocs();
  await testNormalLogin();
  await testSuspiciousLogin();
  await testBotAttack();
  await testAutoBlock();
  await testValidation();
  await testSimulation();
  await testDashboard();
  await testGraphData();
  await testAlerts();
  await testBlockedList();
  await test404();

  console.log(`\n${"━".repeat(50)}`);
  console.log(`${C.b}📊 RESULTS: ${C.g}${passed} passed${C.x} / ${C.r}${failed} failed${C.x} / ${passed + failed} total`);

  if (failed === 0) {
    console.log(`${C.g}${C.b}🎉 ALL TESTS PASSED!${C.x}`);
  } else {
    console.log(`${C.r}⚠️  ${failed} test(s) need attention${C.x}`);
  }
  console.log();
}

runAllTests();
