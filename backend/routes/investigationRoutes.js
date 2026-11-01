const express = require("express");
const mongoose = require("mongoose");
const Investigation = require("../models/Investigation");
const Transaction = require("../models/Transaction");

const router = express.Router();

// GET all investigations with optional status/priority filters
router.get("/", async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filter = {};

    if (status && ["Open", "In Progress", "Resolved"].includes(status)) {
      filter.status = status;
    }
    if (priority && ["Low", "Medium", "High"].includes(priority)) {
      filter.priority = priority;
    }

    const investigations = await Investigation.find(filter)
      .populate("transaction")
      .sort({ createdAt: -1 });

    return res.json(investigations);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch investigations",
      error: error.message,
    });
  }
});

// GET single investigation by ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid investigation ID format",
      });
    }

    const investigation = await Investigation.findById(req.params.id).populate("transaction");

    if (!investigation) {
      return res.status(404).json({
        message: "Investigation not found",
      });
    }

    return res.json(investigation);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch investigation",
      error: error.message,
    });
  }
});

// CREATE investigation
router.post("/", async (req, res) => {
  try {
    const { transactionId, notes, priority, status } = req.body;

    if (!transactionId || !mongoose.isValidObjectId(transactionId)) {
      return res.status(400).json({
        message: "A valid transaction ID is required",
      });
    }

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    const existing = await Investigation.findOne({
      transaction: transactionId,
    });

    if (existing) {
      return res.status(409).json({
        message: "An investigation already exists for this transaction",
        investigationId: existing._id,
      });
    }

    const validPriorities = ["Low", "Medium", "High"];
    const validStatuses = ["Open", "In Progress", "Resolved"];

    const cleanPriority = priority && validPriorities.includes(priority)
      ? priority
      : transaction.riskLevel === "High"
      ? "High"
      : "Medium";

    const cleanStatus = status && validStatuses.includes(status)
      ? status
      : "Open";

    const investigation = await Investigation.create({
      transaction: transactionId,
      notes: typeof notes === "string" ? notes.trim() : "",
      priority: cleanPriority,
      status: cleanStatus,
    });

    const populated = await investigation.populate("transaction");

    return res.status(201).json(populated);
  } catch (error) {
    return res.status(400).json({
      message: "Failed to create investigation",
      error: error.message,
    });
  }
});

// UPDATE investigation
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid investigation ID format",
      });
    }

    const updates = {};
    const { status, notes, priority } = req.body;

    if (status !== undefined) {
      const validStatuses = ["Open", "In Progress", "Resolved"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status '${status}'. Allowed: ${validStatuses.join(", ")}`,
        });
      }
      updates.status = status;
    }

    if (priority !== undefined) {
      const validPriorities = ["Low", "Medium", "High"];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          message: `Invalid priority '${priority}'. Allowed: ${validPriorities.join(", ")}`,
        });
      }
      updates.priority = priority;
    }

    if (notes !== undefined) {
      updates.notes = typeof notes === "string" ? notes.trim() : String(notes);
    }

    const investigation = await Investigation.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("transaction");

    if (!investigation) {
      return res.status(404).json({
        message: "Investigation not found",
      });
    }

    return res.json(investigation);
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Failed to update investigation",
    });
  }
});

module.exports = router;