// ═══════════════════════════════════════════════════════════
//  API Documentation — HTML Version (UPGRADED)
// ═══════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  const port = process.env.PORT || 5000;
  const baseUrl = `http://localhost:${port}`;

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aegis.AI | Backend API Reference</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #6366f1; --dark: #0f172a; --bg: #f8fafc;
            --text: #334155; --code: #1e293b; --accent: #22c55e;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
        .header { background: var(--dark); color: white; padding: 3rem 2rem; border-bottom: 4px solid var(--primary); }
        .container { max-width: 900px; margin: -2rem auto 4rem; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); padding: 2.5rem; }
        h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; letter-spacing: -1px; }
        h2 { border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin: 2rem 0 1rem; color: var(--dark); font-weight: 700; }
        .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; margin-right: 0.5rem; }
        .get { background: #dcfce7; color: #166534; }
        .post { background: #e0e7ff; color: #3730a3; }
        .delete { background: #fee2e2; color: #991b1b; }
        .endpoint { background: #f1f5f9; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; position: relative; }
        .url { font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--dark); margin-left: 0.5rem; }
        .desc { margin-top: 0.5rem; font-size: 0.95rem; }
        code { font-family: 'JetBrains Mono', monospace; background: var(--code); color: #e2e8f0; padding: 1rem; border-radius: 6px; display: block; margin-top: 1rem; overflow-x: auto; font-size: 0.85rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #e2e8f0; }
        th { font-size: 0.85rem; text-transform: uppercase; color: #64748b; }
        .ws-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
        .ws-card { background: #f8fafc; padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary); }
    </style>
</head>
<body>
    <div class="header">
        <div style="max-width: 900px; margin: 0 auto;">
            <h1>🛡️ Aegis.AI</h1>
            <p>Behavioral Threat Detection & Anomaly Analysis System</p>
        </div>
    </div>
    <div class="container">
        <h2>⚡ Core Information</h2>
        <p><strong>Base URL:</strong> <code>${baseUrl}</code></p>
        <p>Capture behavioral markers like <i>time gap, request frequency,</i> and <i>IP patterns</i> to detect bots before they breach.</p>

        <h2>🔗 REST Endpoints</h2>
        
        <div class="endpoint">
            <span class="badge post">POST</span><span class="url">/auth/login</span>
            <p class="desc">Analyze login behavior via ML engine. Returns risk status (Safe / Attack) and risk score (0-100).</p>
            <code>{ "user_id": "alice", "ip": "1.2.3.4", "time_gap": 0.5, "request_rate": 45, "same_ip": 12 }</code>
        </div>

        <div class="endpoint">
            <span class="badge get">GET</span><span class="url">/dashboard</span>
            <p class="desc">Returns real-time system stats, top targeted users, and threat trends.</p>
        </div>

        <div class="endpoint">
            <span class="badge get">GET</span><span class="url">/graph-data</span>
            <p class="desc">Builds network relationship map between IPs and Users. Auto-identifies bot clusters.</p>
        </div>

        <div class="endpoint">
            <span class="badge post">POST</span><span class="url">/simulate/traffic</span>
            <p class="desc">Simulation engine for demo purposes. Populates the DB with mixed traffic patterns.</p>
        </div>

        <h2>📡 WebSocket Events</h2>
        <div class="ws-grid">
            <div class="ws-card"><strong>new_log:</strong> Real-time event for every analysis completed.</div>
            <div class="ws-card"><strong>threat_alert:</strong> Priority events for Suspicious or Attack level activity.</div>
        </div>

        <p style="margin-top: 3rem; text-align: center; color: #94a3b8; font-size: 0.8rem;">
            AegisAI Architecture v1.0 • Running in Development Mode
        </p>
    </div>
</body>
</html>
  `);
});

module.exports = router;
