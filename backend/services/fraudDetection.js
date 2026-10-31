function calculateRisk(transaction) {
  let riskScore = 0;
  const reasons = [];

  const amount = Number(transaction.amount);

  // Rule 1: High transaction amount (> 50,000)
  if (amount > 50000) {
    riskScore += 30;
    reasons.push("High transaction amount");
  }

  // Rule 2: Very high transaction amount (> 100,000)
  if (amount > 100000) {
    riskScore += 20;
    reasons.push("Very high transaction amount");
  }

  // Rule 3: Unusual transaction time (between midnight and 5:00 AM)
  const txDate = transaction.date || transaction.createdAt || new Date();
  const dateObj = new Date(txDate);

  if (!isNaN(dateObj.getTime())) {
    const hour = dateObj.getHours();

    if (hour >= 0 && hour < 5) {
      riskScore += 15;
      reasons.push("Transaction during unusual hours");
    }
  }

  // Limit score to 100
  riskScore = Math.min(riskScore, 100);

  // Determine risk level
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
