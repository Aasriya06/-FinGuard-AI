const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const mongoose = require("mongoose");
const Transaction = require("./models/Transaction");
const calculateRisk = require("./services/fraudDetection");

async function recalculateRiskScores() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully");

    const transactions = await Transaction.find();

    console.log(`Found ${transactions.length} transactions\n`);

    let changedCount = 0;

    for (const transaction of transactions) {
      const { riskScore, riskLevel, reasons } =
        calculateRisk(transaction.toObject());

      const hasChanged =
        transaction.riskScore !== riskScore ||
        transaction.riskLevel !== riskLevel ||
        JSON.stringify(transaction.reasons) !==
        JSON.stringify(reasons);

      console.log(`Transaction: ${transaction.transactionId}`);
      console.log(
        `Current Risk: ${transaction.riskScore}/100 (${transaction.riskLevel})`
      );
      console.log(`New Risk: ${riskScore}/100 (${riskLevel})`);
      console.log(`Reasons: ${reasons.join(", ") || "None"}`);
      console.log(`Needs Update: ${hasChanged ? "Yes" : "No"}`);
      console.log("--------------------------------");

      if (hasChanged) {
        changedCount++;
      }
    }

    console.log("\nPREVIEW SUMMARY");
    console.log(`Total Transactions: ${transactions.length}`);
    console.log(`Transactions Needing Updates: ${changedCount}`);
    console.log("No database records were modified.");
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

recalculateRiskScores();