require("dotenv").config();

const mongoose = require("mongoose");
const Transaction = require("./models/Transaction");
const calculateRisk = require("./services/fraudDetection");

async function recalculateRiskScores() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");

    const transactions = await Transaction.find();

    console.log(`Found ${transactions.length} transactions`);

    let updatedCount = 0;

    for (const transaction of transactions) {
      const { riskScore, riskLevel, reasons } =
        calculateRisk(transaction.toObject());

      await Transaction.updateOne(
        { _id: transaction._id },
        {
          $set: {
            riskScore,
            riskLevel,
            reasons,
          },
        }
      );

      console.log(
        `${transaction.transactionId}: ${riskScore}/100 (${riskLevel})`
      );

      updatedCount++;
    }

    console.log(
      `Successfully updated ${updatedCount} transactions`
    );
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

recalculateRiskScores();