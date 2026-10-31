const mongoose = require("mongoose");

const investigationSchema = new mongoose.Schema(
  {
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved"],
      default: "Open",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Investigation",
  investigationSchema
);