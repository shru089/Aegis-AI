// ═══════════════════════════════════════════════════════════
//  Task 2: ML Service — Connects to Python ML Engine
//  Sends behavior data → Receives risk assessment
// ═══════════════════════════════════════════════════════════

const axios = require("axios");

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";

/**
 * Send behavior data to ML engine for prediction.
 *
 * @param {number} time_gap    - Time between requests (seconds)
 * @param {number} request_rate - Requests per minute
 * @param {number} same_ip     - Repeated attempts from same IP
 * @returns {Object} { risk, score, reasons }
 */
async function predict(time_gap, request_rate, same_ip) {
  try {
    const response = await axios.post(
      `${ML_API_URL}/predict`,
      {
        time_gap,
        request_rate,
        same_ip,
      },
      {
        timeout: 5000, // 5s timeout
        headers: { "Content-Type": "application/json" },
      }
    );

    return response.data;
  } catch (err) {
    // If ML engine is down, return a fallback response using heuristics
    console.error("⚠️  ML API unreachable:", err.message);
    return fallbackPrediction(time_gap, request_rate, same_ip);
  }
}

/**
 * Fallback heuristic-based prediction when ML engine is unavailable.
 * Ensures backend still functions independently.
 */
function fallbackPrediction(time_gap, request_rate, same_ip) {
  const reasons = [];
  let score = 0;

  // Time gap scoring
  if (time_gap < 0.5) {
    score += 35;
    reasons.push("Very fast requests (time gap < 0.5s)");
  } else if (time_gap < 1.0) {
    score += 20;
    reasons.push("Fast requests (time gap < 1s)");
  } else if (time_gap < 2.0) {
    score += 10;
  }

  // Request rate scoring
  if (request_rate > 50) {
    score += 35;
    reasons.push("Very high request rate (> 50 req/min)");
  } else if (request_rate > 25) {
    score += 20;
    reasons.push("High request rate (> 25 req/min)");
  } else if (request_rate > 15) {
    score += 10;
  }

  // Same IP scoring
  if (same_ip > 10) {
    score += 30;
    reasons.push("Many repeated attempts from same IP (> 10)");
  } else if (same_ip > 5) {
    score += 15;
    reasons.push("Repeated attempts from same IP (> 5)");
  }

  // Clamp score
  score = Math.min(score, 100);

  // Determine risk label
  let risk = "Safe";
  if (score >= 70) risk = "Attack";
  else if (score >= 40) risk = "Suspicious";

  if (reasons.length === 0) {
    reasons.push("Normal behavior detected");
  }

  return {
    risk,
    score,
    reasons,
    _fallback: true, // flag so frontend knows ML was offline
  };
}

/**
 * Check if ML engine is reachable.
 */
async function healthCheck() {
  try {
    const response = await axios.get(`${ML_API_URL}/`, { timeout: 3000 });
    return { status: "connected", data: response.data };
  } catch (err) {
    return { status: "disconnected", error: err.message };
  }
}

module.exports = { predict, fallbackPrediction, healthCheck };
