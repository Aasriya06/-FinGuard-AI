import { useEffect, useState } from "react";
import axios from "axios";
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import "./FraudDetection.css";

import { TRANSACTIONS_API as API_URL } from "../config/api";

function FraudDetection() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTransactions = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API_URL);
      setTransactions(response.data);
    } catch (err) {
      setError("Unable to load transactions. Check your backend connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const totalTransactions = transactions.length;

  const highRisk = transactions.filter(
    (transaction) => transaction.riskScore >= 60
  );

  const mediumRisk = transactions.filter(
    (transaction) =>
      transaction.riskScore >= 30 && transaction.riskScore < 60
  );

  const lowRisk = transactions.filter(
    (transaction) => transaction.riskScore < 30
  );

  const averageRisk =
    totalTransactions > 0
      ? (
          transactions.reduce(
            (sum, transaction) => sum + (transaction.riskScore || 0),
            0
          ) / totalTransactions
        ).toFixed(1)
      : "0.0";

  const flaggedTransactions = transactions.filter(
    (transaction) => transaction.riskScore >= 30
  );

  const getRiskClass = (score) => {
    if (score >= 60) return "high";
    if (score >= 30) return "medium";
    return "low";
  };

  return (
    <div className="fraud-page">
      <div className="fraud-header">
        <div>
          <h2>Fraud Detection Overview</h2>
          <p>
            Monitor suspicious financial activity and assess
            transaction risk.
          </p>
        </div>

        <button
          className="fraud-refresh-btn"
          onClick={fetchTransactions}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && <p className="fraud-error">{error}</p>}

      <div className="fraud-stats">
        <div className="fraud-stat-card">
          <div className="fraud-stat-icon blue">
            <Activity size={22} />
          </div>
          <p>Transactions Analyzed</p>
          <h2>{totalTransactions}</h2>
          <span>Transaction records</span>
        </div>

        <div className="fraud-stat-card">
          <div className="fraud-stat-icon red">
            <ShieldAlert size={22} />
          </div>
          <p>High-Risk Transactions</p>
          <h2>{highRisk.length}</h2>
          <span>Requires immediate review</span>
        </div>

        <div className="fraud-stat-card">
          <div className="fraud-stat-icon orange">
            <AlertTriangle size={22} />
          </div>
          <p>Medium-Risk Transactions</p>
          <h2>{mediumRisk.length}</h2>
          <span>Potential suspicious activity</span>
        </div>

        <div className="fraud-stat-card">
          <div className="fraud-stat-icon green">
            <ShieldCheck size={22} />
          </div>
          <p>Average Risk Score</p>
          <h2>{averageRisk}/100</h2>
          <span>{lowRisk.length} low-risk transactions</span>
        </div>
      </div>

      <section className="fraud-table-section">
        <div className="fraud-section-heading">
          <h3>Suspicious Transaction Alerts</h3>
          <span>{flaggedTransactions.length} flagged</span>
        </div>

        {loading ? (
          <p className="fraud-empty">Loading transactions...</p>
        ) : flaggedTransactions.length === 0 ? (
          <p className="fraud-empty">
            No suspicious transactions detected.
          </p>
        ) : (
          <div className="fraud-table-wrapper">
            <table className="fraud-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Amount</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Detection Reasons</th>
                </tr>
              </thead>

              <tbody>
                {flaggedTransactions.map((transaction) => {
                  const riskClass = getRiskClass(
                    transaction.riskScore
                  );

                  return (
                    <tr key={transaction._id}>
                      <td>{transaction.transactionId}</td>
                      <td>{transaction.sender}</td>
                      <td>{transaction.receiver}</td>
                      <td>
                        ₹{Number(transaction.amount).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span className={`fraud-score ${riskClass}`}>
                          {transaction.riskScore}/100
                        </span>
                      </td>
                      <td>
                        <span className={`fraud-level ${riskClass}`}>
                          {riskClass.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {transaction.reasons?.length
                          ? transaction.reasons.join(", ")
                          : "Risk threshold exceeded"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default FraudDetection;