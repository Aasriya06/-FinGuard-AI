const mongoose = require("mongoose");

const investigationSchema = new mongoose.Schema(
  {
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: [true, "Transaction reference is required"],
      unique: true,
    },

    status: {
      type: String,
      enum: {
        values: ["Open", "In Progress", "Resolved"],
        message: "{VALUE} is not a valid investigation status",
      },
      default: "Open",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    priority: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High"],
        message: "{VALUE} is not a valid priority level",
      },
      default: "Medium",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Investigation", investigationSchema);