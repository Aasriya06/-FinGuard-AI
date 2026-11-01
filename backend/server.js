const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const transactionRoutes = require("./routes/transactionRoutes.js");
const investigationRoutes = require("./routes/investigationRoutes");
const crypto = require("crypto");
const Transaction = require("./models/Transaction");
const calculateRisk = require("./services/fraudDetection");

// CORS Configuration with strict allowlist and localhost support
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4173",
  "https://finguard-ai-orpin.vercel.app",
  "https://finguard-ai.vercel.app",
];

const clientUrlOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim().replace(/\/$/, ""))
  : [];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...clientUrlOrigins]));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser or server-to-server requests without origin header (e.g. curl, health checks)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.trim().replace(/\/$/, "");

    // Check exact match in allowlist or Vercel deployment preview pattern
    const isAllowed =
      allowedOrigins.includes(cleanOrigin) ||
      /^https:\/\/finguard-ai(-[a-z0-9]+)?\.vercel\.app$/.test(cleanOrigin);

    if (isAllowed) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by FinGuard AI CORS policy.`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Risk-Preview-Token", "X-Admin-Token"],
};

app.use(cors(corsOptions));
app.use(express.json());

// Database availability middleware for API routes
const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "Database connection is currently unavailable. Please try again shortly.",
      databaseStatus: "Disconnected / Connecting",
    });
  }
  next();
};

// API Routes
app.use("/api/transactions", requireDatabase, transactionRoutes);
app.use("/api/investigations", requireDatabase, investigationRoutes);

// Timing-safe token verification helper
const verifyAdminToken = (providedToken, expectedToken) => {
  if (!providedToken || !expectedToken) return false;
  try {
    const provided = Buffer.from(providedToken, "utf8");
    const expected = Buffer.from(expectedToken, "utf8");
    if (provided.length !== expected.length) return false;
    return crypto.timingSafeEqual(provided, expected);
  } catch {
    return false;
  }
};

// Protected, read-only fraud risk preview
app.get("/api/admin/risk-preview", requireDatabase, async (req, res) => {
  try {
    const expectedToken = process.env.RISK_PREVIEW_TOKEN;
    const providedToken = req.get("X-Risk-Preview-Token") || req.get("Authorization")?.replace(/^Bearer\s+/, "");

    if (!verifyAdminToken(providedToken, expectedToken)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const transactions = await Transaction.find()
      .select("transactionId amount date createdAt riskScore riskLevel reasons isFraudulent")
      .lean();

    const preview = transactions.map((transaction) => {
      const result = calculateRisk(transaction);

      const currentReasons = Array.isArray(transaction.reasons) ? transaction.reasons : [];
      const reasonsMatch =
        currentReasons.length === result.reasons.length &&
        currentReasons.every((r, idx) => r === result.reasons[idx]);

      const needsUpdate =
        transaction.riskScore !== result.riskScore ||
        transaction.riskLevel !== result.riskLevel ||
        !reasonsMatch;

      return {
        transactionId: transaction.transactionId,
        currentRiskScore: transaction.riskScore ?? 0,
        newRiskScore: result.riskScore,
        currentRiskLevel: transaction.riskLevel || "Low",
        newRiskLevel: result.riskLevel,
        currentReasons,
        newReasons: result.reasons,
        needsUpdate,
      };
    });

    res.set("Cache-Control", "no-store");

    return res.json({
      totalTransactions: preview.length,
      transactionsNeedingUpdate: preview.filter((t) => t.needsUpdate).length,
      preview,
      databaseModified: false,
    });
  } catch (error) {
    console.error("Risk preview error:", error.message);
    return res.status(500).json({ message: "Unable to generate risk preview" });
  }
});

// Protected database backup creation endpoint
// Disabled unless explicit ADMIN token provided
app.post("/api/admin/backup", requireDatabase, async (req, res) => {
  try {
    const expectedToken = process.env.RISK_PREVIEW_TOKEN;
    const providedToken = req.get("X-Risk-Preview-Token") || req.get("Authorization")?.replace(/^Bearer\s+/, "");

    if (!verifyAdminToken(providedToken, expectedToken)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const db = mongoose.connection.db;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupCollectionName = `transactions_backup_${timestamp}`;

    const originalTransactions = await Transaction.find().lean();
    if (originalTransactions.length === 0) {
      return res.status(400).json({ message: "No transactions found to backup." });
    }

    await db.collection(backupCollectionName).insertMany(originalTransactions);
    const backupCount = await db.collection(backupCollectionName).countDocuments();

    return res.json({
      success: true,
      message: "Database backup created successfully in MongoDB Atlas.",
      backupCollection: backupCollectionName,
      recordsBackedUp: backupCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Backup error:", error.message);
    return res.status(500).json({ message: "Backup creation failed", error: error.message });
  }
});

// Protected, dry-run or confirmed migration endpoint
// Requires valid token AND explicit confirm=true query parameter to apply updates
app.post("/api/admin/recalculate-risk", requireDatabase, async (req, res) => {
  try {
    const expectedToken = process.env.RISK_PREVIEW_TOKEN;
    const providedToken = req.get("X-Risk-Preview-Token") || req.get("Authorization")?.replace(/^Bearer\s+/, "");

    if (!verifyAdminToken(providedToken, expectedToken)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const isConfirmed = req.query.confirm === "true";

    const transactions = await Transaction.find();
    let updatedCount = 0;
    const updateLog = [];

    for (const tx of transactions) {
      const result = calculateRisk(tx.toObject());
      const currentReasons = Array.isArray(tx.reasons) ? tx.reasons : [];
      const needsUpdate =
        tx.riskScore !== result.riskScore ||
        tx.riskLevel !== result.riskLevel ||
        JSON.stringify(currentReasons) !== JSON.stringify(result.reasons);

      if (needsUpdate) {
        updateLog.push({
          transactionId: tx.transactionId,
          from: { riskScore: tx.riskScore, riskLevel: tx.riskLevel, reasons: currentReasons },
          to: { riskScore: result.riskScore, riskLevel: result.riskLevel, reasons: result.reasons },
        });

        if (isConfirmed) {
          // Perform targeted update ONLY of risk fields, preserving all other fields
          await Transaction.updateOne(
            { _id: tx._id },
            {
              $set: {
                riskScore: result.riskScore,
                riskLevel: result.riskLevel,
                reasons: result.reasons,
              },
            }
          );
        }
        updatedCount++;
      }
    }

    return res.json({
      success: true,
      mode: isConfirmed ? "APPLIED" : "DRY_RUN",
      totalTransactions: transactions.length,
      recordsRequiringUpdate: updatedCount,
      recordsUpdated: isConfirmed ? updatedCount : 0,
      details: updateLog,
      message: isConfirmed
        ? `Successfully updated ${updatedCount} transactions.`
        : "Dry run completed. Pass ?confirm=true to apply.",
    });
  } catch (error) {
    console.error("Migration error:", error.message);
    return res.status(500).json({ message: "Migration execution failed", error: error.message });
  }
});

// Health check API
app.get("/api/health", (req, res) => {
  const dbStates = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };

  const dbState = mongoose.connection.readyState;

  res.json({
    status: "OK",
    application: "FinGuard AI",
    service: "Backend API",
    database: dbStates[dbState] || "Unknown",
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    name: "FinGuard AI API",
    version: "1.0.0",
    health: "/api/health",
  });
});

// Global safe error handler (prevents leaking internal details in production)
app.use((err, req, res, next) => {
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ message: err.message });
  }
  console.error("Unhandled error:", err.message);
  return res.status(500).json({
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// Asynchronous MongoDB connection with event monitoring
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("WARNING: MONGO_URI is not set in environment variables.");
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB initial connection error:", error.message);
  }
};

mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established.");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection event error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Mongoose will attempt to reconnect.");
});

// Start HTTP server
const PORT = process.env.PORT || 5001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`FinGuard AI backend running on port ${PORT}`);
    connectDB();
  });
}

module.exports = app;
