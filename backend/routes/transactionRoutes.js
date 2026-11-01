const express = require("express");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Investigation = require("../models/Investigation");
const calculateRisk = require("../services/fraudDetection");

const router = express.Router();

// CREATE: Add a new transaction
router.post("/", async (req, res) => {
  try {
    const { transactionId, sender, receiver, amount, transactionType, status } = req.body;

    // Strict pre-validation for clear user messages
    if (!transactionId || typeof transactionId !== "string" || !transactionId.trim()) {
      return res.status(400).json({ message: "Transaction ID is required and cannot be empty" });
    }
    if (!sender || typeof sender !== "string" || !sender.trim()) {
      return res.status(400).json({ message: "Sender is required and cannot be empty" });
    }
    if (!receiver || typeof receiver !== "string" || !receiver.trim()) {
      return res.status(400).json({ message: "Receiver is required and cannot be empty" });
    }

    const numAmount = typeof amount === "number" ? amount : Number(amount);
    if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: "Amount must be a valid positive number greater than ₹0.00" });
    }

    const cleanTxId = transactionId.trim();

    // Check duplicate transaction ID
    const existing = await Transaction.findOne({ transactionId: cleanTxId });
    if (existing) {
      return res.status(409).json({ message: `Transaction ID '${cleanTxId}' already exists` });
    }

    // Validate enum fields
    const validTypes = ["UPI", "Bank Transfer", "Card", "Wallet"];
    const type = transactionType || "UPI";
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `Unsupported transaction type '${type}'. Allowed: ${validTypes.join(", ")}` });
    }

    const validStatuses = ["Completed", "Pending", "Failed"];
    const txStatus = status || "Completed";
    if (!validStatuses.includes(txStatus)) {
      return res.status(400).json({ message: `Unsupported status '${txStatus}'. Allowed: ${validStatuses.join(", ")}` });
    }

    // Calculate risk score deterministically
    const { riskScore, riskLevel, reasons } = calculateRisk({
      amount: numAmount,
      date: req.body.date || new Date(),
    });

    const transaction = new Transaction({
      transactionId: cleanTxId,
      sender: sender.trim(),
      receiver: receiver.trim(),
      amount: numAmount,
      transactionType: type,
      status: txStatus,
      riskScore,
      riskLevel,
      reasons,
      isFraudulent: false,
    });

    const savedTransaction = await transaction.save();
    return res.status(201).json(savedTransaction);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Transaction ID already exists" });
    }
    return res.status(400).json({
      message: error.message || "Error creating transaction",
    });
  }
});

// READ: Get all transactions with optional query filters
router.get("/", async (req, res) => {
  try {
    const { riskLevel, transactionType, status, search } = req.query;
    const filter = {};

    if (riskLevel && ["Low", "Medium", "High"].includes(riskLevel)) {
      filter.riskLevel = riskLevel;
    }
    if (transactionType && ["UPI", "Bank Transfer", "Card", "Wallet"].includes(transactionType)) {
      filter.transactionType = transactionType;
    }
    if (status && ["Completed", "Pending", "Failed"].includes(status)) {
      filter.status = status;
    }
    if (search && typeof search === "string" && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { transactionId: regex },
        { sender: regex },
        { receiver: regex },
      ];
    }

    const transactions = await Transaction.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json(transactions);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch transactions",
    });
  }
});

// READ: Get a single transaction by ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid transaction ID format",
      });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    return res.json(transaction);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch transaction",
    });
  }
});

// UPDATE: Modify a transaction and recalculate fraud risk
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid transaction ID format",
      });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    const { sender, receiver, amount, transactionType, status, isFraudulent } = req.body;

    if (sender !== undefined) {
      if (typeof sender !== "string" || !sender.trim()) {
        return res.status(400).json({ message: "Sender cannot be empty" });
      }
      transaction.sender = sender.trim();
    }

    if (receiver !== undefined) {
      if (typeof receiver !== "string" || !receiver.trim()) {
        return res.status(400).json({ message: "Receiver cannot be empty" });
      }
      transaction.receiver = receiver.trim();
    }

    if (amount !== undefined) {
      const numAmount = typeof amount === "number" ? amount : Number(amount);
      if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
        return res.status(400).json({ message: "Amount must be a valid positive number" });
      }
      transaction.amount = numAmount;
    }

    if (transactionType !== undefined) {
      const validTypes = ["UPI", "Bank Transfer", "Card", "Wallet"];
      if (!validTypes.includes(transactionType)) {
        return res.status(400).json({ message: `Unsupported transaction type. Allowed: ${validTypes.join(", ")}` });
      }
      transaction.transactionType = transactionType;
    }

    if (status !== undefined) {
      const validStatuses = ["Completed", "Pending", "Failed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `Unsupported status. Allowed: ${validStatuses.join(", ")}` });
      }
      transaction.status = status;
    }

    if (isFraudulent !== undefined) {
      transaction.isFraudulent = Boolean(isFraudulent);
    }

    // Recalculate fraud risk using updated transaction data
    const { riskScore, riskLevel, reasons } = calculateRisk({
      amount: transaction.amount,
      createdAt: transaction.createdAt,
    });

    transaction.riskScore = riskScore;
    transaction.riskLevel = riskLevel;
    transaction.reasons = reasons;

    const savedTransaction = await transaction.save();

    return res.json({
      message: "Transaction updated successfully",
      transaction: savedTransaction,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Failed to update transaction",
    });
  }
});

// DELETE: Remove a transaction and clean up linked investigations
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid transaction ID format",
      });
    }

    const transaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    // Cascade delete linked investigations to prevent broken references
    await Investigation.deleteMany({ transaction: req.params.id });

    return res.json({
      message: "Transaction deleted successfully",
      transactionId: transaction.transactionId,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete transaction",
    });
  }
});

module.exports = router;