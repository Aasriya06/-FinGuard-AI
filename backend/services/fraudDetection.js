/**
 * FinGuard AI - Fraud Risk Calculation Service
 * 
 * Rules:
 * 1. Transaction amount > ₹50,000: +30 points ("High transaction amount")
 * 2. Transaction amount > ₹100,000: +20 additional points ("Very high transaction amount")
 * 3. Unusual transaction time (00:00 to 04:59 UTC / standardized): +15 points ("Transaction during unusual hours")
 * 4. Maximum risk score: 100
 * 
 * Risk Classifications:
 * - Low: 0 to 29
 * - Medium: 30 to 59
 * - High: 60 to 100
 */

function calculateRisk(transaction) {
  if (!transaction || typeof transaction !== "object") {
    return {
      riskScore: 0,
      riskLevel: "Low",
      reasons: [],
    };
  }

  let riskScore = 0;
  const reasons = [];

  const rawAmount = transaction.amount;
  const amount = typeof rawAmount === "number" ? rawAmount : Number(rawAmount);

  // Validate amount is a positive finite number
  if (!isNaN(amount) && amount > 0) {
    // Rule 1: High transaction amount (> ₹50,000)
    if (amount > 50000) {
      riskScore += 30;
      reasons.push("High transaction amount");
    }

    // Rule 2: Very high transaction amount (> ₹100,000)
    if (amount > 100000) {
      riskScore += 20;
      reasons.push("Very high transaction amount");
    }
  }

  // Rule 3: Unusual transaction time (between midnight 00:00 and 05:00)
  // Use deterministic UTC hour extraction so server host timezone does not cause score drift
  const txDate = transaction.date || transaction.createdAt || transaction.timestamp;
  if (txDate) {
    const dateObj = new Date(txDate);
    if (!isNaN(dateObj.getTime())) {
      const utcHour = dateObj.getUTCHours();
      if (utcHour >= 0 && utcHour < 5) {
        riskScore += 15;
        reasons.push("Transaction during unusual hours");
      }
    }
  }

  // Ensure riskScore stays strictly within [0, 100]
  riskScore = Math.min(Math.max(riskScore, 0), 100);

  // Classify risk level deterministically
  let riskLevel = "Low";
  if (riskScore >= 60) {
    riskLevel = "High";
  } else if (riskScore >= 30) {
    riskLevel = "Medium";
  }

  return {
    riskScore,
    riskLevel,
    reasons,
  };
}

module.exports = calculateRisk;
