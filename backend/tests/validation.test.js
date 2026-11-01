const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const Transaction = require("../models/Transaction");
const Investigation = require("../models/Investigation");

describe("FinGuard AI - Schema & Model Validation", () => {
  describe("Transaction Model Validation", () => {
    it("should reject transaction with empty transactionId", async () => {
      const tx = new Transaction({
        transactionId: "   ",
        sender: "Alice",
        receiver: "Bob",
        amount: 1000,
        transactionType: "UPI",
      });
      let error;
      try {
        await tx.validate();
      } catch (err) {
        error = err;
      }
      assert.ok(error, "Expected validation error for empty transactionId");
      assert.ok(error.errors.transactionId);
    });

    it("should reject transaction with non-positive amount", async () => {
      const txZero = new Transaction({
        transactionId: "TXN_TEST_0",
        sender: "Alice",
        receiver: "Bob",
        amount: 0,
        transactionType: "UPI",
      });
      let errZero;
      try {
        await txZero.validate();
      } catch (err) {
        errZero = err;
      }
      assert.ok(errZero, "Expected validation error for 0 amount");
      assert.ok(errZero.errors.amount);

      const txNegative = new Transaction({
        transactionId: "TXN_TEST_NEG",
        sender: "Alice",
        receiver: "Bob",
        amount: -500,
        transactionType: "UPI",
      });
      let errNeg;
      try {
        await txNegative.validate();
      } catch (err) {
        errNeg = err;
      }
      assert.ok(errNeg, "Expected validation error for negative amount");
      assert.ok(errNeg.errors.amount);
    });

    it("should reject transaction with unsupported transaction type", async () => {
      const tx = new Transaction({
        transactionId: "TXN_TEST_TYPE",
        sender: "Alice",
        receiver: "Bob",
        amount: 1000,
        transactionType: "Bitcoin",
      });
      let error;
      try {
        await tx.validate();
      } catch (err) {
        error = err;
      }
      assert.ok(error, "Expected validation error for unsupported type");
      assert.ok(error.errors.transactionType);
    });

    it("should reject transaction with unsupported status", async () => {
      const tx = new Transaction({
        transactionId: "TXN_TEST_STATUS",
        sender: "Alice",
        receiver: "Bob",
        amount: 1000,
        transactionType: "UPI",
        status: "Archived",
      });
      let error;
      try {
        await tx.validate();
      } catch (err) {
        error = err;
      }
      assert.ok(error, "Expected validation error for unsupported status");
      assert.ok(error.errors.status);
    });

    it("should accept valid transaction", async () => {
      const tx = new Transaction({
        transactionId: "TXN_VALID_01",
        sender: "Alice",
        receiver: "Bob",
        amount: 5000,
        transactionType: "UPI",
        status: "Completed",
      });
      await tx.validate();
    });
  });

  describe("Investigation Model Validation", () => {
    it("should reject investigation with invalid status", async () => {
      const inv = new Investigation({
        transaction: "6addd2df0ba026f19c9dc8b0",
        status: "ClosedPermanent",
      });
      let error;
      try {
        await inv.validate();
      } catch (err) {
        error = err;
      }
      assert.ok(error, "Expected validation error for invalid status");
      assert.ok(error.errors.status);
    });

    it("should reject investigation with invalid priority", async () => {
      const inv = new Investigation({
        transaction: "6addd2df0ba026f19c9dc8b0",
        priority: "Urgent",
      });
      let error;
      try {
        await inv.validate();
      } catch (err) {
        error = err;
      }
      assert.ok(error, "Expected validation error for invalid priority");
      assert.ok(error.errors.priority);
    });

    it("should accept valid investigation", async () => {
      const inv = new Investigation({
        transaction: "6addd2df0ba026f19c9dc8b0",
        status: "In Progress",
        priority: "High",
        notes: "Verifying high-value transfer",
      });
      await inv.validate();
    });
  });
});
