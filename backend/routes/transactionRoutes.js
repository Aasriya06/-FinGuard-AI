const calculateRisk = require("../services/fraudDetection");
const express = require("express");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

const router = express.Router();

// CREATE: Add a new transaction
router.post("/", async (req, res) => {
  try {
    const { riskScore, riskLevel, reasons } = calculateRisk(req.body);

    const transaction = new Transaction({
      ...req.body,
      riskScore,
      riskLevel,
      reasons,
    });

    const savedTransaction = await transaction.save();

    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(500).json({
      message: "Error creating transaction",
      error: error.message,
    });
  }
});

// READ: Get all transactions
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({
      createdAt: -1,
    });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch transactions",
    });
  }
});

// READ: Get a transaction by ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid transaction ID",
      });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch transaction",
    });
  }
});

// UPDATE: Modify a transaction and recalculate fraud risk
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid transaction ID",
      });
    }

    const allowedFields = [
      "sender",
      "receiver",
      "amount",
      "transactionType",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    // Find the existing transaction
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    // Apply permitted updates
    Object.assign(transaction, updates);

    // Recalculate fraud risk using updated information
    const { riskScore, riskLevel, reasons } = calculateRisk(transaction);

    transaction.riskScore = riskScore;
    transaction.riskLevel = riskLevel;
    transaction.reasons = reasons;

    // Save the updated transaction
    const savedTransaction = await transaction.save();

    res.json({
      message: "Transaction updated successfully",
      transaction: savedTransaction,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// DELETE: Remove a transaction
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid transaction ID",
      });
    }

    const transaction = await Transaction.findByIdAndDelete(
      req.params.id
    );

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete transaction",
    });
  }
});

module.exports = router;