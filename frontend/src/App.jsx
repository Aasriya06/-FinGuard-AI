import { useEffect, useState } from "react";
import axios from "axios";

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
} from "lucide-react";

import "./App.css";
import { TRANSACTIONS_API as API_URL, checkHealth } from "./config/api";

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

  // Fetch transactions from MongoDB through backend API
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(API_URL);
      setTransactions(response.data);
    } catch (err) {
      console.error("Dashboard API Error:", err);
      const backendMessage =
        err.response?.data?.message ||
        "Unable to load dashboard data. Check your backend connection.";
      setError(backendMessage);
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

  // Dashboard calculations
  const totalTransactions = transactions.length;

  const transactionVolume = transactions.reduce(
    (total, transaction) => total + Number(transaction.amount || 0),
    0
  );

  const suspiciousTransactions = transactions.filter(
    (transaction) =>
      transaction.riskLevel === "Medium" || transaction.riskLevel === "High"
  ).length;

  const highRiskAlerts = transactions.filter(
    (transaction) => transaction.riskLevel === "High"
  ).length;

  const averageRiskScore =
    totalTransactions > 0
      ? (
          transactions.reduce(
            (total, transaction) => total + Number(transaction.riskScore || 0),
            0
          ) / totalTransactions
        ).toFixed(1)
      : "0.0";

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

  return (
    <div className="app">
      {/* Sidebar */}
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
          <span>FinGuard AI v1.0</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">FINANCIAL MONITORING PLATFORM</p>
            <h1>{activePage}</h1>
          </div>

          <div className="status" title={`Database: ${systemHealth.database || "Unknown"}`}>
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
            {/* Welcome Section */}
            <section className="welcome-card">
              <h2>Financial Intelligence Overview</h2>
              <p>
                Monitor transactions, identify suspicious activity, and analyze
                financial risk using real-time transaction data.
              </p>
            </section>

            {/* Refresh Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "20px",
              }}
            >
              <button
                onClick={() => {
                  fetchTransactions();
                  updateHealth();
                }}
                disabled={loading}
                style={{
                  background: "#0284c7",
                  color: "white",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  cursor: loading ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 500,
                }}
              >
                <RefreshCw size={16} className={loading ? "spin" : ""} />
                {loading ? "Refreshing..." : "Refresh Dashboard"}
              </button>
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  padding: "16px 20px",
                  borderRadius: "12px",
                  marginBottom: "22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  color: "#fca5a5",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <AlertCircle size={22} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: "#f87171" }}>Connection Notice:</strong>{" "}
                    {error}
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                      Target API: <code>{API_URL}</code> | Backend:{" "}
                      <span style={{ color: isOnline ? "#22c55e" : "#f59e0b" }}>
                        {systemHealth.status} (DB: {systemHealth.database || "Disconnected"})
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    fetchTransactions();
                    updateHealth();
                  }}
                  disabled={loading}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Dashboard Statistics */}
            <section className="stats-grid">
              <div className="stat-card">
                <p>Total Transactions</p>
                <h2>{totalTransactions}</h2>
                <span>Database records</span>
              </div>

              <div className="stat-card">
                <p>Transaction Volume</p>
                <h2>{formatCurrency(transactionVolume)}</h2>
                <span>Total processed amount</span>
              </div>

              <div className="stat-card">
                <p>Suspicious Transactions</p>
                <h2>{suspiciousTransactions}</h2>
                <span>Medium and high risk</span>
              </div>

              <div className="stat-card">
                <p>High-Risk Alerts</p>
                <h2>{highRiskAlerts}</h2>
                <span>Requires immediate review</span>
              </div>
            </section>

            {/* Risk Overview */}
            <section className="dashboard-panel">
              <h2>Risk Monitoring Overview</h2>

              <p>
                Average Risk Score:
                <strong> {averageRiskScore}/100</strong>
              </p>

              <p>
                Total Transactions Analyzed:
                <strong> {totalTransactions}</strong>
              </p>

              <p>
                Suspicious Transactions:
                <strong> {suspiciousTransactions}</strong>
              </p>
            </section>

            {/* Recent Transactions */}
            <section
              className="dashboard-panel"
              style={{ marginTop: "24px" }}
            >
              <h2>Recent Transactions</h2>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "20px",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Sender</th>
                      <th>Receiver</th>
                      <th>Amount</th>
                      <th>Risk Score</th>
                      <th>Risk Level</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.slice(0, 5).map((transaction) => (
                      <tr key={transaction._id}>
                        <td>{transaction.transactionId}</td>
                        <td>{transaction.sender}</td>
                        <td>{transaction.receiver}</td>
                        <td>{formatCurrency(transaction.amount)}</td>
                        <td>{transaction.riskScore || 0}/100</td>
                        <td>{transaction.riskLevel || "Low"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {transactions.length === 0 && !loading && !error && (
                  <p style={{ marginTop: "20px" }}>
                    No transactions available.
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
