const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    sender: {
      type: String,
      required: true,
      trim: true,
    },

    receiver: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    transactionType: {
      type: String,
      enum: ["UPI", "Bank Transfer", "Card", "Wallet"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Completed", "Pending", "Failed"],
      default: "Completed",
    },

    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    reasons: {
      type: [String],
      default: [],
    },

    isFraudulent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);