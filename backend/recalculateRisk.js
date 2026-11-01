const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const mongoose = require("mongoose");
const Transaction = require("./models/Transaction");
const calculateRisk = require("./services/fraudDetection");

async function recalculateRiskScores() {
  const isConfirmed = process.argv.includes("--confirm");

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully.\n");

    const transactions = await Transaction.find().sort({ createdAt: 1 });

    console.log(`Found ${transactions.length} total transactions in database:\n`);

    let changedCount = 0;
    const pendingUpdates = [];

    for (const transaction of transactions) {
      const { riskScore, riskLevel, reasons } = calculateRisk(transaction.toObject());

      const currentReasons = Array.isArray(transaction.reasons) ? transaction.reasons : [];
      const reasonsMatch =
        currentReasons.length === reasons.length &&
        currentReasons.every((r, idx) => r === reasons[idx]);

      const hasChanged =
        transaction.riskScore !== riskScore ||
        transaction.riskLevel !== riskLevel ||
        !reasonsMatch;

      console.log(`Transaction: ${transaction.transactionId}`);
      console.log(`  Current: ${transaction.riskScore}/100 [${transaction.riskLevel || "Low"}] | Reasons: ${currentReasons.join(", ") || "None"}`);
      console.log(`  Target:  ${riskScore}/100 [${riskLevel}] | Reasons: ${reasons.join(", ") || "None"}`);
      console.log(`  Needs Update: ${hasChanged ? "YES" : "NO"}`);
      console.log("--------------------------------------------------");

      if (hasChanged) {
        changedCount++;
        pendingUpdates.push({
          _id: transaction._id,
          transactionId: transaction.transactionId,
          riskScore,
          riskLevel,
          reasons,
        });
      }
    }

    console.log("\n================ PREVIEW SUMMARY ================");
    console.log(`Total Transactions Analyzed: ${transactions.length}`);
    console.log(`Transactions Needing Updates: ${changedCount}`);

    if (isConfirmed) {
      console.log("\nApplying safe, targeted updates...");
      for (const update of pendingUpdates) {
        await Transaction.updateOne(
          { _id: update._id },
          {
            $set: {
              riskScore: update.riskScore,
              riskLevel: update.riskLevel,
              reasons: update.reasons,
            },
          }
        );
        console.log(`  ✓ Updated ${update.transactionId} -> Score: ${update.riskScore}, Level: ${update.riskLevel}`);
      }
      console.log(`\nSuccessfully updated ${changedCount} transaction records in MongoDB.`);
    } else {
      console.log("\nDRY-RUN MODE: No database records were modified.");
      console.log("To apply these changes after verifying database backup, re-run with: node recalculateRisk.js --confirm");
    }
  } catch (error) {
    console.error("Migration Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

if (require.main === module) {
  recalculateRiskScores();
}

module.exports = recalculateRiskScores;