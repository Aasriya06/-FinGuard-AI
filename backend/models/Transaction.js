const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: [true, "Transaction ID is required"],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return typeof v === "string" && v.trim().length > 0;
        },
        message: "Transaction ID cannot be empty",
      },
    },

    sender: {
      type: String,
      required: [true, "Sender name is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return typeof v === "string" && v.trim().length > 0;
        },
        message: "Sender cannot be empty",
      },
    },

    receiver: {
      type: String,
      required: [true, "Receiver name is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return typeof v === "string" && v.trim().length > 0;
        },
        message: "Receiver cannot be empty",
      },
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than zero (minimum ₹0.01)"],
      validate: {
        validator: function (v) {
          return typeof v === "number" && !isNaN(v) && isFinite(v) && v > 0;
        },
        message: "Amount must be a valid positive number",
      },
    },

    transactionType: {
      type: String,
      enum: {
        values: ["UPI", "Bank Transfer", "Card", "Wallet"],
        message: "{VALUE} is not a supported transaction type",
      },
      required: [true, "Transaction type is required"],
    },

    status: {
      type: String,
      enum: {
        values: ["Completed", "Pending", "Failed"],
        message: "{VALUE} is not a valid status",
      },
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