// ═══════════════════════════════════════════════════════════
//  Database Configuration
//  Supports: MongoDB (via Mongoose) OR In-Memory storage
// ═══════════════════════════════════════════════════════════

const mongoose = require("mongoose");

async function connectDB() {
  const useMongo = process.env.USE_MONGO === "true";

  if (useMongo) {
    try {
      const uri = process.env.MONGO_URI || "mongodb://localhost:27017/aegis_ai";
      await mongoose.connect(uri);
      console.log("✅ Connected to MongoDB:", uri);
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err.message);
      console.log("⚠️  Falling back to in-memory storage");
    }
  } else {
    console.log("💾 Using in-memory storage (set USE_MONGO=true for MongoDB)");
  }
}

module.exports = { connectDB };
