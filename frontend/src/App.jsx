import { useEffect, useState, useMemo } from "react";
import Transactions from "./components/Transactions";
import FraudDetection from "./components/FraudDetection";
import RiskAnalytics from "./components/RiskAnalytics";
import Investigations from "./components/Investigations";

import {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldAlert,
  ChartNoAxesCombined,
  ClipboardList,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Activity,
} from "lucide-react";

import "./App.css";
import { transactionsApi, checkHealth, extractErrorMessage, API_URL } from "./config/api";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [systemHealth, setSystemHealth] = useState({
    status: "Checking...",
    database: "Checking...",
  });

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Transactions", icon: ArrowLeftRight },
    { name: "Fraud Detection", icon: ShieldAlert },
    { name: "Risk Analytics", icon: ChartNoAxesCombined },
    { name: "Investigations", icon: ClipboardList },
  ];

  const updateHealth = async () => {
    const health = await checkHealth();
    setSystemHealth(health);
  };

  useEffect(() => {
    updateHealth();
    const interval = setInterval(updateHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await transactionsApi.getAll();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Dashboard API Error:", err);
      setError(
        extractErrorMessage(
          err,
          "Unable to load dashboard data. Check your backend connection."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch data whenever Dashboard is opened
  useEffect(() => {
    if (activePage === "Dashboard") {
      fetchTransactions();
    }
  }, [activePage]);

  // Dashboard calculations using real database records
  const totalTransactions = transactions.length;

  const transactionVolume = useMemo(() => {
    return transactions.reduce(
      (total, tx) => total + Number(tx.amount || 0),
      0
    );
  }, [transactions]);

  // Accurate classifications: Low (0-29), Medium (30-59), High (60-100)
  const highRiskCount = useMemo(() => {
    return transactions.filter(
      (tx) => tx.riskLevel === "High" || (Number(tx.riskScore) || 0) >= 60
    ).length;
  }, [transactions]);

  const mediumRiskCount = useMemo(() => {
    return transactions.filter(
      (tx) =>
        (tx.riskLevel === "Medium" ||
          ((Number(tx.riskScore) || 0) >= 30 && (Number(tx.riskScore) || 0) < 60)) &&
        tx.riskLevel !== "High" &&
        (Number(tx.riskScore) || 0) < 60
    ).length;
  }, [transactions]);

  const lowRiskCount = useMemo(() => {
    return transactions.filter(
      (tx) =>
        tx.riskLevel === "Low" ||
        (!tx.riskLevel && (Number(tx.riskScore) || 0) < 30)
    ).length;
  }, [transactions]);

  // Unified Suspicious Transactions: Medium + High Risk (Score >= 30)
  const suspiciousTransactions = useMemo(() => {
    return highRiskCount + mediumRiskCount;
  }, [highRiskCount, mediumRiskCount]);

  const averageRiskScore = useMemo(() => {
    return totalTransactions > 0
      ? (
          transactions.reduce(
            (total, tx) => total + Number(tx.riskScore || 0),
            0
          ) / totalTransactions
        ).toFixed(1)
      : "0.0";
  }, [transactions, totalTransactions]);

  // Top Fraud Alerts requiring immediate review
  const fraudAlerts = useMemo(() => {
    return transactions
      .filter((tx) => (Number(tx.riskScore) || 0) >= 30 || tx.riskLevel === "High" || tx.riskLevel === "Medium")
      .slice(0, 4);
  }, [transactions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isOnline =
    systemHealth.status === "OK" && systemHealth.database === "Connected";
  const isConnecting =
    systemHealth.status === "OK" && systemHealth.database !== "Connected";

  const getRiskBadge = (level, score) => {
    const s = Number(score) || 0;
    if (level === "High" || s >= 60) {
      return <span className="risk-pill high">HIGH ({s})</span>;
    }
    if (level === "Medium" || s >= 30) {
      return <span className="risk-pill medium">MED ({s})</span>;
    }
    return <span className="risk-pill low">LOW ({s})</span>;
  };

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <ShieldCheck size={30} />
          <h2>FinGuard AI</h2>
        </div>

        <p className="sidebar-label">FINANCIAL INTELLIGENCE</p>

        <nav>
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={
                  activePage === item.name ? "nav-item active" : "nav-item"
                }
                onClick={() => setActivePage(item.name)}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <ShieldCheck size={18} />
          <span>FinGuard AI v1.0 • Production Ready</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">FINANCIAL RISK & MONITORING PLATFORM</p>
            <h1>{activePage}</h1>
          </div>

          <div
            className="status"
            title={`Database: ${systemHealth.database || "Unknown"}`}
          >
            <span
              className="status-dot"
              style={{
                background: isOnline
                  ? "#22c55e"
                  : isConnecting
                  ? "#f59e0b"
                  : "#ef4444",
              }}
            ></span>
            {isOnline
              ? "System Online"
              : isConnecting
              ? `DB: ${systemHealth.database}`
              : "Backend Offline"}
          </div>
        </header>

        {activePage === "Dashboard" ? (
          <>
            {/* Welcome Banner */}
            <section className="welcome-card">
              <h2>Financial Intelligence & Risk Operations</h2>
              <p>
                Continuous algorithmic monitoring, fraud pattern classification,
                and transaction investigation audit trail powered by real-time data.
              </p>
            </section>

            {/* Refresh Toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                Target API: <code>{API_URL}</code> | Database:{" "}
                <strong style={{ color: isOnline ? "#4ade80" : "#f59e0b" }}>
                  {systemHealth.database || "Unknown"}
                </strong>
              </span>

              <button
                onClick={() => {
                  fetchTransactions();
                  updateHealth();
                }}
                disabled={loading}
                className="dashboard-refresh-btn"
              >
                <RefreshCw size={16} className={loading ? "spin" : ""} />
                {loading ? "Refreshing..." : "Refresh Dashboard"}
              </button>
            </div>

            {/* Error Notice */}
            {error && (
              <div className="dashboard-error-banner">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <AlertCircle size={22} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: "#f87171" }}>Connection Notice:</strong>{" "}
                    {error}
                  </div>
                </div>
                <button
                  onClick={() => {
                    fetchTransactions();
                    updateHealth();
                  }}
                  disabled={loading}
                  className="retry-btn"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Primary Metrics Grid (Items 1 - 6) */}
            <section className="stats-grid">
              <div className="stat-card">
                <p>Total Transactions</p>
                <h2>{totalTransactions}</h2>
                <span>1. Verified DB records</span>
              </div>

              <div className="stat-card">
                <p>Total Transaction Volume</p>
                <h2>{formatCurrency(transactionVolume)}</h2>
                <span>2. Processed amount</span>
              </div>

              <div className="stat-card">
                <p>Suspicious Transactions</p>
                <h2>{suspiciousTransactions}</h2>
                <span>3. Medium + High Risk (Score ≥ 30)</span>
              </div>

              <div className="stat-card">
                <p>High-Risk Alerts</p>
                <h2>{highRiskCount}</h2>
                <span>4. Score ≥ 60 (Immediate Action)</span>
              </div>
            </section>

            {/* Risk Breakdown Summary Row (Items 5 & 6 & 7) */}
            <section className="dashboard-subgrid">
              <div className="sub-stat-card">
                <div className="sub-stat-header">
                  <span className="dot dot-low" />
                  <h4>Low-Risk Activity</h4>
                </div>
                <h3>{lowRiskCount}</h3>
                <p>Score 0 to 29 (Baseline)</p>
              </div>

              <div className="sub-stat-card">
                <div className="sub-stat-header">
                  <span className="dot dot-med" />
                  <h4>Medium-Risk Activity</h4>
                </div>
                <h3>{mediumRiskCount}</h3>
                <p>Score 30 to 59 (Flagged)</p>
              </div>

              <div className="sub-stat-card">
                <div className="sub-stat-header">
                  <span className="dot dot-high" />
                  <h4>High-Risk Activity</h4>
                </div>
                <h3>{highRiskCount}</h3>
                <p>Score 60 to 100 (Critical)</p>
              </div>

              <div className="sub-stat-card">
                <div className="sub-stat-header">
                  <Activity size={16} className="text-accent" />
                  <h4>Average Risk Score</h4>
                </div>
                <h3>{averageRiskScore}/100</h3>
                <p>Mean across all records</p>
              </div>
            </section>

            {/* Risk Distribution Visual Progress Bar (Item 7) */}
            <section className="dashboard-panel" style={{ marginTop: "24px" }}>
              <div className="panel-header-row">
                <h2>7. Risk Tier Distribution</h2>
                <span className="panel-badge">
                  {totalTransactions} Total Evaluated
                </span>
              </div>

              <div className="distribution-bar">
                <div
                  className="bar-segment seg-low"
                  style={{
                    width: totalTransactions
                      ? `${(lowRiskCount / totalTransactions) * 100}%`
                      : "0%",
                  }}
                  title={`Low Risk: ${lowRiskCount}`}
                />
                <div
                  className="bar-segment seg-med"
                  style={{
                    width: totalTransactions
                      ? `${(mediumRiskCount / totalTransactions) * 100}%`
                      : "0%",
                  }}
                  title={`Medium Risk: ${mediumRiskCount}`}
                />
                <div
                  className="bar-segment seg-high"
                  style={{
                    width: totalTransactions
                      ? `${(highRiskCount / totalTransactions) * 100}%`
                      : "0%",
                  }}
                  title={`High Risk: ${highRiskCount}`}
                />
              </div>

              <div className="distribution-legend">
                <span>
                  <span className="legend-indicator dot-low" /> Low Risk:{" "}
                  <strong>{lowRiskCount}</strong> (
                  {totalTransactions
                    ? ((lowRiskCount / totalTransactions) * 100).toFixed(0)
                    : 0}
                  %)
                </span>
                <span>
                  <span className="legend-indicator dot-med" /> Medium Risk:{" "}
                  <strong>{mediumRiskCount}</strong> (
                  {totalTransactions
                    ? ((mediumRiskCount / totalTransactions) * 100).toFixed(0)
                    : 0}
                  %)
                </span>
                <span>
                  <span className="legend-indicator dot-high" /> High Risk:{" "}
                  <strong>{highRiskCount}</strong> (
                  {totalTransactions
                    ? ((highRiskCount / totalTransactions) * 100).toFixed(0)
                    : 0}
                  %)
                </span>
              </div>
            </section>

            {/* Split Section: Fraud Alerts (Item 9) & Trends (Item 10) */}
            <div className="dashboard-split-row">
              {/* Fraud Alerts (Item 9) */}
              <section className="dashboard-panel half-panel">
                <div className="panel-header-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldAlert size={20} color="#f87171" />
                    <h2>9. Active Fraud Alerts</h2>
                  </div>
                  <button
                    className="link-btn"
                    onClick={() => setActivePage("Fraud Detection")}
                  >
                    View All <ArrowUpRight size={14} />
                  </button>
                </div>

                {fraudAlerts.length === 0 ? (
                  <p className="clean-state-msg">
                    No active high or medium risk alerts. All transactions within nominal parameters.
                  </p>
                ) : (
                  <div className="alerts-list">
                    {fraudAlerts.map((tx) => (
                      <div key={tx._id} className="alert-item">
                        <div className="alert-meta">
                          <span className="alert-id">{tx.transactionId}</span>
                          <span className="alert-amount">{formatCurrency(tx.amount)}</span>
                        </div>
                        <div className="alert-reasons">
                          {tx.reasons && tx.reasons.length > 0
                            ? tx.reasons.join(" • ")
                            : "Risk threshold triggered"}
                        </div>
                        <div className="alert-footer">
                          {getRiskBadge(tx.riskLevel, tx.riskScore)}
                          <span className="alert-time">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("en-IN") : "Recent"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Transaction Trends Summary (Item 10) */}
              <section className="dashboard-panel half-panel">
                <div className="panel-header-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <TrendingUp size={20} color="#38bdf8" />
                    <h2>10. Intelligence & Trends</h2>
                  </div>
                  <button
                    className="link-btn"
                    onClick={() => setActivePage("Risk Analytics")}
                  >
                    Analytics <ArrowUpRight size={14} />
                  </button>
                </div>

                <div className="trends-card-body">
                  <div className="trend-stat-row">
                    <span>Average Transaction Value:</span>
                    <strong>
                      {totalTransactions
                        ? formatCurrency(transactionVolume / totalTransactions)
                        : "₹0"}
                    </strong>
                  </div>
                  <div className="trend-stat-row">
                    <span>Risk Alert Ratio:</span>
                    <strong>
                      {totalTransactions
                        ? `${((suspiciousTransactions / totalTransactions) * 100).toFixed(1)}%`
                        : "0%"}
                    </strong>
                  </div>
                  <div className="trend-stat-row">
                    <span>Audit Pipeline Health:</span>
                    <strong style={{ color: "#4ade80" }}>
                      {systemHealth.database === "Connected" ? "Operational (Atlas)" : "Standby"}
                    </strong>
                  </div>
                  <div className="trend-stat-row">
                    <span>Heuristic Verification:</span>
                    <strong>100% Deterministic (UTC)</strong>
                  </div>
                </div>
              </section>
            </div>

            {/* Recent Transactions Table (Item 8) */}
            <section className="dashboard-panel" style={{ marginTop: "24px" }}>
              <div className="panel-header-row">
                <h2>8. Recent Transactions</h2>
                <button
                  className="link-btn"
                  onClick={() => setActivePage("Transactions")}
                >
                  Manage All Transactions <ArrowUpRight size={14} />
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Sender</th>
                      <th>Receiver</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Risk Evaluation</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.slice(0, 6).map((tx) => (
                      <tr key={tx._id}>
                        <td>
                          <span className="mono-text">{tx.transactionId}</span>
                        </td>
                        <td>{tx.sender}</td>
                        <td>{tx.receiver}</td>
                        <td className="amount-text">{formatCurrency(tx.amount)}</td>
                        <td>
                          <span className="type-pill">{tx.transactionType}</span>
                        </td>
                        <td>{getRiskBadge(tx.riskLevel, tx.riskScore)}</td>
                        <td>
                          <span className={`status-dot-inline ${(tx.status || "completed").toLowerCase()}`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {transactions.length === 0 && !loading && !error && (
                  <p style={{ marginTop: "20px", color: "#94a3b8", textAlign: "center" }}>
                    No transactions available in database.
                  </p>
                )}
              </div>
            </section>
          </>
        ) : activePage === "Transactions" ? (
          <Transactions />
        ) : activePage === "Fraud Detection" ? (
          <FraudDetection />
        ) : activePage === "Risk Analytics" ? (
          <RiskAnalytics />
        ) : activePage === "Investigations" ? (
          <Investigations />
        ) : (
          <section className="dashboard-panel">
            <h2>{activePage}</h2>
            <p>Module not available.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
