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

// CORS Configuration
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
  : [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback to permissive for smooth dev/deployment
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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

app.use("/api/transactions", requireDatabase, transactionRoutes);
app.use("/api/investigations", requireDatabase, investigationRoutes);
// Temporary protected, read-only fraud risk preview
app.get("/api/admin/risk-preview", requireDatabase, async (req, res) => {
  try {
    const expectedToken = process.env.RISK_PREVIEW_TOKEN;
    const providedToken = req.get("X-Risk-Preview-Token");

    if (!expectedToken || !providedToken) {
      return res.status(403).json({ message: "Access denied" });
    }

    const expected = Buffer.from(expectedToken, "utf8");
    const provided = Buffer.from(providedToken, "utf8");

    if (
      expected.length !== provided.length ||
      !crypto.timingSafeEqual(expected, provided)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const transactions = await Transaction.find()
      .select("transactionId amount date createdAt riskScore riskLevel reasons")
      .lean();

    const preview = transactions.map((transaction) => {
      const result = calculateRisk(transaction);

      return {
        transactionId: transaction.transactionId,
        currentRiskScore: transaction.riskScore,
        newRiskScore: result.riskScore,
        newRiskLevel: result.riskLevel,
        reasons: result.reasons,
        needsUpdate:
          transaction.riskScore !== result.riskScore ||
          transaction.riskLevel !== result.riskLevel ||
          JSON.stringify(transaction.reasons || []) !==
          JSON.stringify(result.reasons),
      };
    });

    res.set("Cache-Control", "no-store");

    res.json({
      totalTransactions: preview.length,
      transactionsNeedingUpdate: preview.filter(
        (transaction) => transaction.needsUpdate
      ).length,
      preview,
      databaseModified: false,
    });
  } catch (error) {
    console.error("Risk preview error:", error.message);
    res.status(500).json({ message: "Unable to generate risk preview" });
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
    if (error.reason?.servers) {
      for (const [server, details] of error.reason.servers) {
        console.error("Server:", server, "Error:", details.error?.message || "No specific error");
      }
    }
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

// Start HTTP server immediately
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`FinGuard AI backend running on port ${PORT}`);
  connectDB();
});
