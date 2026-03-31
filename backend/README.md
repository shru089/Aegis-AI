# 🛡️ Aegis.AI — Backend Engine

> **The Behavioral Threat Intelligence Hub.** 
> Connecting ML detection to real-time defense.

---

## 🚀 Impact Summary
This backend isn't just a middleware; it's a **pro-active security system** designed for high-frequency attack detection. 

*   **Behavioral Brain:** Connects to Python ML Engine for anomaly scoring.
*   **Active Defense:** Automatic IP blocking for scores > 90.
*   **Live Intelligence:** Real-time Socket.IO alerts and Bot Cluster detection.
*   **Silent Insight:** Integrated Geo-IP for visual threat mapping.

---

## 🛠️ Tech Stack
| Core | Security | Utils |
| :--- | :--- | :--- |
| **Node.js** v20+ | **Helmet.js** (CSP/XSS) | **Socket.IO** (Live) |
| **Express** | **Rate Limiters** (DoS Protection) | **UUID** (Req-Tracking) |
| **DB Fallback** | **Auto-Block Middleware** | **Geo-IP Mapper** |

---

## 🔗 Key API Endpoints

### 🚥 Analysis & Defense
*   `POST /auth/login` → Capture behavior and predict risk.
*   `GET /auth/blocked` → List currently blocked threat actors.

### 📋 Intelligence & Dashboard
*   `GET /dashboard` → Aggregate stats, trends, and top attackers.
*   `GET /graph-data` → Network visualization (Nodes, Links, & Clusters).
*   `GET /alerts` → Filtered high-risk events.

### 📄 Developer Tools
*   `GET /docs` → **Upgraded:** Beautiful HTML API documentation.
*   `POST /simulate/traffic` → Demo simulation engine.

---

## ⚡ Setup & Run

```bash
# 1. Install
npm install

# 2. Configure (.env)
USE_MONGO=false
ML_API_URL=http://localhost:8000

# 3. Launch
npm run dev
```

---

## 🧪 Simulation Command
**To populate the dashboard for your demo:**
```bash
npm run simulate
```

---
*Built for the 12-hour Hackathon Sprint. Aegis.AI Architecture v1.0*
