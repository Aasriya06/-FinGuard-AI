const express = require("express");
const mongoose = require("mongoose");

const Investigation = require("../models/Investigation");
const Transaction = require("../models/Transaction");

const router = express.Router();

// GET all investigations
router.get("/", async (req, res) => {
  try {
    const investigations = await Investigation.find()
      .populate("transaction")
      .sort({ createdAt: -1 });

    res.json(investigations);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch investigations",
      error: error.message,
    });
  }
});

// CREATE investigation
router.post("/", async (req, res) => {
  try {
    const { transactionId, notes, priority } = req.body;

    if (!mongoose.isValidObjectId(transactionId)) {
      return res.status(400).json({
        message: "Invalid transaction ID",
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
        message: "Investigation already exists",
      });
    }

    const investigation = await Investigation.create({
      transaction: transactionId,
      notes,
      priority,
    });

    res.status(201).json(investigation);
  } catch (error) {
    res.status(500).json({
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
        message: "Invalid investigation ID",
      });
    }

    const updates = {};
    const allowedFields = ["status", "notes", "priority"];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    const investigation = await Investigation.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!investigation) {
      return res.status(404).json({
        message: "Investigation not found",
      });
    }

    res.json(investigation);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

module.exports = router;