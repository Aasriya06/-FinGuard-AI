const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const calculateRisk = require("../services/fraudDetection");

describe("FinGuard AI - Fraud Detection Service", () => {
  describe("Amount Thresholds", () => {
    it("should assign 0 points for amounts <= ₹50,000 (standard hours)", () => {
      const result = calculateRisk({
        amount: 50000,
        date: "2026-10-25T14:00:00Z",
      });
      assert.equal(result.riskScore, 0);
      assert.equal(result.riskLevel, "Low");
      assert.deepEqual(result.reasons, []);
    });

    it("should assign +30 points for amounts > ₹50,000 and <= ₹100,000", () => {
      const result = calculateRisk({
        amount: 50001,
        date: "2026-10-25T14:00:00Z",
      });
      assert.equal(result.riskScore, 30);
      assert.equal(result.riskLevel, "Medium");
      assert.deepEqual(result.reasons, ["High transaction amount"]);
    });

    it("should assign exactly +30 points at exactly ₹100,000", () => {
      const result = calculateRisk({
        amount: 100000,
        date: "2026-10-25T14:00:00Z",
      });
      assert.equal(result.riskScore, 30);
      assert.equal(result.riskLevel, "Medium");
      assert.deepEqual(result.reasons, ["High transaction amount"]);
    });

    it("should assign +50 points (30 + 20) for amounts > ₹100,000", () => {
      const result = calculateRisk({
        amount: 100001,
        date: "2026-10-25T14:00:00Z",
      });
      assert.equal(result.riskScore, 50);
      assert.equal(result.riskLevel, "Medium");
      assert.deepEqual(result.reasons, [
        "High transaction amount",
        "Very high transaction amount",
      ]);
    });
  });

  describe("Unusual Hours Thresholds (00:00 to 04:59 UTC)", () => {
    it("should assign +15 points at exactly midnight 00:00", () => {
      const result = calculateRisk({
        amount: 1000,
        date: "2026-10-25T00:00:00Z",
      });
      assert.equal(result.riskScore, 15);
      assert.equal(result.riskLevel, "Low");
      assert.deepEqual(result.reasons, ["Transaction during unusual hours"]);
    });

    it("should assign +15 points at 04:59", () => {
      const result = calculateRisk({
        amount: 1000,
        date: "2026-10-25T04:59:59Z",
      });
      assert.equal(result.riskScore, 15);
      assert.equal(result.riskLevel, "Low");
      assert.deepEqual(result.reasons, ["Transaction during unusual hours"]);
    });

    it("should NOT assign unusual hours points at 05:00", () => {
      const result = calculateRisk({
        amount: 1000,
        date: "2026-10-25T05:00:00Z",
      });
      assert.equal(result.riskScore, 0);
      assert.equal(result.riskLevel, "Low");
      assert.deepEqual(result.reasons, []);
    });
  });

  describe("Combined Rules & Classifications", () => {
    it("should classify ₹150,000 at 02:00 as High risk (30 + 20 + 15 = 65)", () => {
      const result = calculateRisk({
        amount: 150000,
        date: "2026-10-25T02:00:00Z",
      });
      assert.equal(result.riskScore, 65);
      assert.equal(result.riskLevel, "High");
      assert.equal(result.reasons.length, 3);
      assert.ok(result.reasons.includes("High transaction amount"));
      assert.ok(result.reasons.includes("Very high transaction amount"));
      assert.ok(result.reasons.includes("Transaction during unusual hours"));
    });

    it("should strictly cap scores at 100", () => {
      // Even if artificial score exceeds 100
      const result = calculateRisk({
        amount: 200000,
        date: "2026-10-25T03:00:00Z",
      });
      assert.ok(result.riskScore <= 100);
    });

    it("should be strictly deterministic over multiple recalculations", () => {
      const tx = {
        amount: 120000,
        date: "2026-10-25T09:42:56.126Z",
      };
      const r1 = calculateRisk(tx);
      const r2 = calculateRisk(tx);
      assert.deepEqual(r1, r2);
    });
  });

  describe("Existing Database Transactions Verification", () => {
    const existingCases = [
      { id: "TXN1001", amount: 2500, date: "2026-10-24T14:39:19.580Z", expectedScore: 0, expectedLevel: "Low" },
      { id: "ABCD", amount: 50000, date: "2026-10-24T15:11:17.518Z", expectedScore: 0, expectedLevel: "Low" },
      { id: "t20", amount: 120000, date: "2026-10-25T09:42:56.126Z", expectedScore: 50, expectedLevel: "Medium" },
      { id: "TXN2001", amount: 150000, date: "2026-10-25T09:46:10.285Z", expectedScore: 50, expectedLevel: "Medium" },
      { id: "TXN5001", amount: 150000, date: "2026-10-25T09:49:44.445Z", expectedScore: 50, expectedLevel: "Medium" },
      { id: "TXN6001", amount: 150000, date: "2026-10-25T09:58:55.758Z", expectedScore: 50, expectedLevel: "Medium" },
    ];

    for (const c of existingCases) {
      it(`should produce expected score ${c.expectedScore} for transaction ${c.id}`, () => {
        const res = calculateRisk({ amount: c.amount, date: c.date });
        assert.equal(res.riskScore, c.expectedScore);
        assert.equal(res.riskLevel, c.expectedLevel);
      });
    }
  });
});
