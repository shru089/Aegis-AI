// ═══════════════════════════════════════════════════════════
//  Log Model — MongoDB Schema
//  Stores behavior logs with ML risk assessment
// ═══════════════════════════════════════════════════════════

const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    ip: { type: String, required: true },
    time_gap: { type: Number, required: true },
    request_rate: { type: Number, required: true },
    same_ip: { type: Number, required: true },
    risk: { type: String, enum: ["Safe", "Suspicious", "Attack"], default: "Safe" },
    score: { type: Number, default: 0 },
    reasons: { type: [String], default: [] },
    blocked: { type: Boolean, default: false },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

module.exports = mongoose.model("Log", logSchema);
