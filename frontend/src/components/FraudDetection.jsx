import { useEffect, useState, useMemo } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  ShieldCheck,
  RefreshCw,
  Search,
  Eye,
  X,
} from "lucide-react";
import "./FraudDetection.css";
import { transactionsApi, extractErrorMessage } from "../config/api";

function FraudDetection() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("SUSPICIOUS"); // "SUSPICIOUS", "HIGH", "MEDIUM", "CONFIRMED_FRAUD", "ALL"
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await transactionsApi.getAll();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractErrorMessage(err, "Unable to load fraud detection data. Check your backend connection."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const totalTransactions = transactions.length;

  const highRisk = useMemo(
    () => transactions.filter((tx) => (tx.riskScore ?? 0) >= 60 || tx.riskLevel === "High"),
    [transactions]
  );

  const mediumRisk = useMemo(
    () =>
      transactions.filter(
        (tx) =>
          ((tx.riskScore ?? 0) >= 30 && (tx.riskScore ?? 0) < 60) ||
          tx.riskLevel === "Medium"
      ),
    [transactions]
  );

  const lowRisk = useMemo(
    () =>
      transactions.filter(
        (tx) => (tx.riskScore ?? 0) < 30 && tx.riskLevel !== "Medium" && tx.riskLevel !== "High"
      ),
    [transactions]
  );

  // Unified Suspicious Definition: Medium Risk + High Risk (Risk Score >= 30)
  const suspiciousTransactions = useMemo(
    () => transactions.filter((tx) => (tx.riskScore ?? 0) >= 30 || tx.riskLevel === "Medium" || tx.riskLevel === "High"),
    [transactions]
  );

  const confirmedFraud = useMemo(
    () => transactions.filter((tx) => Boolean(tx.isFraudulent)),
    [transactions]
  );

  const averageRisk =
    totalTransactions > 0
      ? (
          transactions.reduce((sum, tx) => sum + (Number(tx.riskScore) || 0), 0) /
          totalTransactions
        ).toFixed(1)
      : "0.0";

  // Filtered view by active tab & search
  const displayedTransactions = useMemo(() => {
    let list = [];
    if (activeTab === "SUSPICIOUS") list = suspiciousTransactions;
    else if (activeTab === "HIGH") list = highRisk;
    else if (activeTab === "MEDIUM") list = mediumRisk;
    else if (activeTab === "CONFIRMED_FRAUD") list = confirmedFraud;
    else list = transactions;

    if (!search.trim()) return list;

    const q = search.toLowerCase().trim();
    return list.filter(
      (tx) =>
        (tx.transactionId && tx.transactionId.toLowerCase().includes(q)) ||
        (tx.sender && tx.sender.toLowerCase().includes(q)) ||
        (tx.receiver && tx.receiver.toLowerCase().includes(q))
    );
  }, [activeTab, search, suspiciousTransactions, highRisk, mediumRisk, confirmedFraud, transactions]);

  const getRiskClass = (score, level) => {
    if (score >= 60 || level === "High") return "high";
    if (score >= 30 || level === "Medium") return "medium";
    return "low";
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amt) || 0);
  };

  return (
    <div className="fraud-page">
      {/* Header */}
      <div className="fraud-header">
        <div>
          <h2>Fraud Detection Engine</h2>
          <p>
            Real-time algorithmic risk scoring and suspicious financial activity detection.
          </p>
        </div>

        <button
          className="fraud-refresh-btn"
          onClick={fetchTransactions}
          disabled={loading}
          title="Refresh Detection Data"
        >
          <RefreshCw size={17} className={loading ? "spin" : ""} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {error && <p className="fraud-error">{error}</p>}

      {/* Distinction Definition Banner */}
      <div className="fraud-definition-card">
        <div className="definition-item">
          <strong>Potentially Suspicious:</strong> Evaluated by scoring algorithms (Score ≥ 30: Medium or High risk) due to amounts or transaction timing.
        </div>
        <div className="definition-divider" />
        <div className="definition-item">
          <strong>Confirmed Fraud:</strong> Verified malicious activity flagged through manual or automated investigation review.
        </div>
      </div>

      {/* Metric Cards */}
      <div className="fraud-stats">
        <div className="fraud-stat-card">
          <div className="fraud-stat-icon blue">
            <Activity size={22} />
          </div>
          <p>Transactions Analyzed</p>
          <h2>{totalTransactions}</h2>
          <span>100% verified records</span>
        </div>

        <div className="fraud-stat-card">
          <div className="fraud-stat-icon red">
            <ShieldAlert size={22} />
          </div>
          <p>High-Risk Activity</p>
          <h2>{highRisk.length}</h2>
          <span>Score ≥ 60/100 (Immediate action)</span>
        </div>

        <div className="fraud-stat-card">
          <div className="fraud-stat-icon orange">
            <AlertTriangle size={22} />
          </div>
          <p>Medium-Risk Activity</p>
          <h2>{mediumRisk.length}</h2>
          <span>Score 30-59 (Suspicious alerts)</span>
        </div>

        <div className="fraud-stat-card">
          <div className="fraud-stat-icon green">
            <ShieldCheck size={22} />
          </div>
          <p>Low-Risk Activity</p>
          <h2>{lowRisk.length}</h2>
          <span>Score 0-29 (Avg: {averageRisk}/100)</span>
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <section className="fraud-table-section">
        <div className="fraud-toolbar">
          <div className="fraud-tabs">
            <button
              className={`fraud-tab ${activeTab === "SUSPICIOUS" ? "active" : ""}`}
              onClick={() => setActiveTab("SUSPICIOUS")}
            >
              Suspicious ({suspiciousTransactions.length})
            </button>
            <button
              className={`fraud-tab ${activeTab === "HIGH" ? "active" : ""}`}
              onClick={() => setActiveTab("HIGH")}
            >
              High Risk ({highRisk.length})
            </button>
            <button
              className={`fraud-tab ${activeTab === "MEDIUM" ? "active" : ""}`}
              onClick={() => setActiveTab("MEDIUM")}
            >
              Medium Risk ({mediumRisk.length})
            </button>
            <button
              className={`fraud-tab ${activeTab === "CONFIRMED_FRAUD" ? "active" : ""}`}
              onClick={() => setActiveTab("CONFIRMED_FRAUD")}
            >
              Confirmed Fraud ({confirmedFraud.length})
            </button>
            <button
              className={`fraud-tab ${activeTab === "ALL" ? "active" : ""}`}
              onClick={() => setActiveTab("ALL")}
            >
              All Transactions ({totalTransactions})
            </button>
          </div>

          <div className="fraud-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search flagged queue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Queue Table */}
        {loading ? (
          <div className="fraud-empty">
            <RefreshCw size={24} className="spin text-accent" />
            <p>Analyzing fraud detection records...</p>
          </div>
        ) : displayedTransactions.length === 0 ? (
          <div className="fraud-empty">
            <ShieldCheck size={36} color="#4ade80" />
            <h3>No Records in Selected Queue</h3>
            <p>No transactions match the current tab filter.</p>
          </div>
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
                  <th>Classification</th>
                  <th>Detection Reasons</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {displayedTransactions.map((tx) => {
                  const riskClass = getRiskClass(tx.riskScore, tx.riskLevel);
                  const isFraud = Boolean(tx.isFraudulent);

                  return (
                    <tr key={tx._id} className={isFraud ? "row-confirmed-fraud" : ""}>
                      <td className="fraud-tx-id">
                        <span>{tx.transactionId}</span>
                        {isFraud && <span className="confirmed-badge">CONFIRMED FRAUD</span>}
                      </td>
                      <td>{tx.sender}</td>
                      <td>{tx.receiver}</td>
                      <td className="fraud-amount-cell">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td>
                        <span className={`fraud-score ${riskClass}`}>
                          {tx.riskScore ?? 0}/100
                        </span>
                      </td>
                      <td>
                        <span className={`fraud-level ${riskClass}`}>
                          {tx.riskLevel || riskClass.toUpperCase()}
                        </span>
                      </td>
                      <td className="reasons-cell">
                        {tx.reasons && tx.reasons.length > 0 ? (
                          <div className="reasons-tags">
                            {tx.reasons.map((r, i) => (
                              <span key={i} className="reason-tag">
                                {r}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="no-reasons">Baseline risk</span>
                        )}
                      </td>
                      <td>
                        <span className={`fraud-status-pill status-${(tx.status || "completed").toLowerCase()}`}>
                          {tx.status || "Completed"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="fraud-inspect-btn"
                          onClick={() => setSelectedTx(tx)}
                          title="Inspect fraud factors"
                        >
                          <Eye size={15} />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* INSPECT MODAL */}
      {selectedTx && (
        <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="fraud-inspect-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Fraud Analysis Report: {selectedTx.transactionId}</h2>
              <button onClick={() => setSelectedTx(null)} className="close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="inspect-body">
              <div className="inspect-header-card">
                <div>
                  <span className="inspect-sub">Transaction Amount</span>
                  <h3>{formatCurrency(selectedTx.amount)}</h3>
                </div>
                <div className="inspect-score-wrap">
                  <span className={`fraud-score ${getRiskClass(selectedTx.riskScore, selectedTx.riskLevel)} large`}>
                    Risk Score: {selectedTx.riskScore ?? 0}/100
                  </span>
                  <span className={`fraud-level ${getRiskClass(selectedTx.riskScore, selectedTx.riskLevel)}`}>
                    Level: {selectedTx.riskLevel || "Low"}
                  </span>
                </div>
              </div>

              <div className="inspect-details-grid">
                <div>
                  <label>Sender Account</label>
                  <p>{selectedTx.sender}</p>
                </div>
                <div>
                  <label>Receiver Account</label>
                  <p>{selectedTx.receiver}</p>
                </div>
                <div>
                  <label>Payment Method</label>
                  <p>{selectedTx.transactionType}</p>
                </div>
                <div>
                  <label>Transaction Status</label>
                  <p>{selectedTx.status}</p>
                </div>
                <div>
                  <label>Fraud Classification</label>
                  <p>{selectedTx.isFraudulent ? "Confirmed Fraud" : "Algorithmic Risk Flag (Unconfirmed)"}</p>
                </div>
                <div>
                  <label>Timestamp</label>
                  <p>{selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString("en-IN") : "N/A"}</p>
                </div>
              </div>

              <div className="inspect-rules-card">
                <h4>Heuristic & Algorithmic Trigger Analysis:</h4>
                <div className="rules-breakdown">
                  <div className={`rule-check ${selectedTx.amount > 50000 ? "triggered" : "passed"}`}>
                    <span className="rule-badge">{selectedTx.amount > 50000 ? "+30 pts" : "0 pts"}</span>
                    <div>
                      <strong>Rule 1: High Amount (&gt; ₹50,000)</strong>
                      <p>Transaction amount is ₹{selectedTx.amount.toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  <div className={`rule-check ${selectedTx.amount > 100000 ? "triggered" : "passed"}`}>
                    <span className="rule-badge">{selectedTx.amount > 100000 ? "+20 pts" : "0 pts"}</span>
                    <div>
                      <strong>Rule 2: Very High Amount (&gt; ₹100,000)</strong>
                      <p>Requires enhanced audit threshold</p>
                    </div>
                  </div>

                  <div className={`rule-check ${selectedTx.reasons?.includes("Transaction during unusual hours") ? "triggered" : "passed"}`}>
                    <span className="rule-badge">
                      {selectedTx.reasons?.includes("Transaction during unusual hours") ? "+15 pts" : "0 pts"}
                    </span>
                    <div>
                      <strong>Rule 3: Unusual Hours (Midnight to 5:00 AM)</strong>
                      <p>Off-hours execution check</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setSelectedTx(null)}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FraudDetection;