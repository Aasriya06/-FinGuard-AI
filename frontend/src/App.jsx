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
  Layers,
  Percent,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import "./App.css";
import { transactionsApi, checkHealth, extractErrorMessage } from "./config/api";

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

  useEffect(() => {
    if (activePage === "Dashboard") {
      fetchTransactions();
    }
  }, [activePage]);

  // Dashboard calculations based on real MongoDB records
  const totalTransactions = transactions.length;

  const transactionVolume = useMemo(() => {
    return transactions.reduce(
      (total, tx) => total + Number(tx.amount || 0),
      0
    );
  }, [transactions]);

  // Classifications: Low (0-29), Medium (30-59), High (60-100)
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

  // Unified Suspicious Transactions: Medium + High Risk (Score >= 30)
  const suspiciousTransactions = useMemo(() => {
    return highRiskCount + mediumRiskCount;
  }, [highRiskCount, mediumRiskCount]);

  const legitimateTransactions = useMemo(() => {
    return Math.max(0, totalTransactions - suspiciousTransactions);
  }, [totalTransactions, suspiciousTransactions]);

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

  // Dynamic Detection Rate calculation
  const detectionRate = useMemo(() => {
    return totalTransactions > 0
      ? ((suspiciousTransactions / totalTransactions) * 100).toFixed(1)
      : "0.0";
  }, [totalTransactions, suspiciousTransactions]);

  // Risk Trend Chart Data (Chronological progression of risk scores)
  const riskTrendData = useMemo(() => {
    const sorted = [...transactions].reverse();
    return sorted.map((tx) => ({
      name: tx.transactionId,
      riskScore: Number(tx.riskScore) || 0,
      amount: Number(tx.amount) || 0,
      level: tx.riskLevel || (Number(tx.riskScore) >= 60 ? "High" : Number(tx.riskScore) >= 30 ? "Medium" : "Low"),
    }));
  }, [transactions]);

  // Suspicious vs Legitimate Donut Chart Data
  const donutData = useMemo(() => [
    { name: "Legitimate Transactions", value: legitimateTransactions, color: "#10B981" },
    { name: "Suspicious Flagged", value: suspiciousTransactions, color: "#F43F5E" },
  ], [legitimateTransactions, suspiciousTransactions]);

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
      {/* Dark Premium Fintech Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo-icon">
            <ShieldCheck size={24} color="#F8FAFC" />
          </div>
          <div>
            <h2>FinGuard AI</h2>
            <span className="brand-tag">FINTECH SHIELD</span>
          </div>
        </div>

        <p className="sidebar-label">NAVIGATION</p>

        <nav>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.name;

            return (
              <button
                key={item.name}
                className={isActive ? "nav-item active" : "nav-item"}
                onClick={() => setActivePage(item.name)}
              >
                <Icon size={19} className="nav-icon" />
                <span>{item.name}</span>
                {isActive && <div className="active-pill" />}
              </button>
            );
          })}
        </nav>

        {/* Decorative Purple Wave Graphics at bottom of sidebar */}
        <div className="sidebar-wave-container">
          <svg className="sidebar-wave" viewBox="0 0 200 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="purpleWaveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              d="M0,30 C50,60 100,10 150,40 C180,55 190,20 200,35 L200,80 L0,80 Z"
              fill="url(#purpleWaveGradient)"
            />
            <path
              d="M0,45 C40,25 90,65 140,35 C170,15 190,50 200,40"
              fill="none"
              stroke="#A78BFA"
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
          </svg>
        </div>

        <div className="sidebar-footer">
          <div className="footer-status-indicator">
            <span
              className="pulse-dot"
              style={{
                background: isOnline ? "#10B981" : isConnecting ? "#F59E0B" : "#F43F5E",
              }}
            />
            <span>{isOnline ? "Live Network" : isConnecting ? "Connecting" : "Offline"}</span>
          </div>
          <span className="version-tag">v2.0 Premium</span>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-breadcrumb">
              <span>PLATFORM</span>
              <span className="breadcrumb-separator">/</span>
              <span className="current-crumb">{activePage}</span>
            </div>
            <h1>{activePage}</h1>
          </div>

          <div className="topbar-actions">
            <div
              className="status-pill"
              title={`Database Status: ${systemHealth.database || "Unknown"}`}
            >
              <span
                className="status-dot"
                style={{
                  background: isOnline
                    ? "#10B981"
                    : isConnecting
                    ? "#F59E0B"
                    : "#F43F5E",
                }}
              />
              <span className="status-text">
                {isOnline
                  ? "Atlas Connected"
                  : isConnecting
                  ? `DB: ${systemHealth.database}`
                  : "Database Disconnected"}
              </span>
            </div>

            {activePage === "Dashboard" && (
              <button
                onClick={() => {
                  fetchTransactions();
                  updateHealth();
                }}
                disabled={loading}
                className="refresh-action-btn"
                title="Refresh real-time data"
              >
                <RefreshCw size={15} className={loading ? "spin" : ""} />
                <span>{loading ? "Syncing..." : "Sync Data"}</span>
              </button>
            )}
          </div>
        </header>

        {activePage === "Dashboard" ? (
          <div className="dashboard-container">
            {error && (
              <div className="dashboard-alert-banner">
                <AlertCircle size={20} color="#F43F5E" />
                <div className="alert-text">
                  <strong>Backend Synchronisation Alert:</strong> {error}
                </div>
                <button
                  onClick={fetchTransactions}
                  className="alert-retry-btn"
                  disabled={loading}
                >
                  Retry
                </button>
              </div>
            )}

            {/* 1. Four Summary Cards */}
            <section className="summary-cards-grid">
              {/* Card 1: Total Transactions */}
              <div className="fintech-summary-card card-purple">
                <div className="card-header-row">
                  <span className="card-label">Total Transactions</span>
                  <div className="card-icon-wrap icon-purple">
                    <Layers size={20} color="#A78BFA" />
                  </div>
                </div>
                <div className="card-value-row">
                  <h2>{totalTransactions}</h2>
                </div>
                <div className="card-subtext-row">
                  <span className="trend-highlight">
                    <TrendingUp size={13} /> {formatCurrency(transactionVolume)}
                  </span>
                  <span className="card-sub-muted">processed volume</span>
                </div>
                <div className="card-accent-glow glow-purple" />
              </div>

              {/* Card 2: Suspicious Transactions */}
              <div className="fintech-summary-card card-red">
                <div className="card-header-row">
                  <span className="card-label">Suspicious Transactions</span>
                  <div className="card-icon-wrap icon-red">
                    <ShieldAlert size={20} color="#F43F5E" />
                  </div>
                </div>
                <div className="card-value-row">
                  <h2 className="text-red">{suspiciousTransactions}</h2>
                </div>
                <div className="card-subtext-row">
                  <span className="badge-critical">
                    {highRiskCount} High Risk
                  </span>
                  <span className="card-sub-muted">Score ≥ 30/100</span>
                </div>
                <div className="card-accent-glow glow-red" />
              </div>

              {/* Card 3: Average Risk Score */}
              <div className="fintech-summary-card card-cyan">
                <div className="card-header-row">
                  <span className="card-label">Average Risk Score</span>
                  <div className="card-icon-wrap icon-cyan">
                    <Activity size={20} color="#06B6D4" />
                  </div>
                </div>
                <div className="card-value-row">
                  <h2>{averageRiskScore}<span className="unit">/100</span></h2>
                </div>
                <div className="card-subtext-row">
                  <span className="badge-cyan">
                    {Number(averageRiskScore) < 30 ? "Nominal Baseline" : "Elevated Risk"}
                  </span>
                  <span className="card-sub-muted">Deterministic UTC</span>
                </div>
                <div className="card-accent-glow glow-cyan" />
              </div>

              {/* Card 4: Detection Rate */}
              <div className="fintech-summary-card card-green">
                <div className="card-header-row">
                  <span className="card-label">Detection Rate</span>
                  <div className="card-icon-wrap icon-green">
                    <Percent size={20} color="#10B981" />
                  </div>
                </div>
                <div className="card-value-row">
                  <h2>{detectionRate}<span className="unit">%</span></h2>
                </div>
                <div className="card-subtext-row">
                  <span className="badge-green">
                    {legitimateTransactions} Legitimate
                  </span>
                  <span className="card-sub-muted">Flagged ratio</span>
                </div>
                <div className="card-accent-glow glow-green" />
              </div>
            </section>

            {/* 2. Charts Section: Purple Line/Area Chart & Red/Green Donut Chart */}
            <section className="dashboard-charts-grid">
              {/* Chart 1: Purple Gradient Risk Trends Line/Area Chart */}
              <div className="fintech-chart-card chart-large">
                <div className="chart-card-header">
                  <div>
                    <div className="chart-title-tag">HEURISTIC EVALUATION</div>
                    <h3>Transaction Risk Trends</h3>
                  </div>
                  <span className="chart-meta-pill">Score (0–100)</span>
                </div>

                <div className="chart-wrapper">
                  {riskTrendData.length === 0 ? (
                    <div className="chart-empty-state">No transaction records available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={riskTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="purpleRiskGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                        <XAxis
                          dataKey="name"
                          stroke="#94A3B8"
                          fontSize={12}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#94A3B8"
                          fontSize={12}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0F172A",
                            borderColor: "#334155",
                            borderRadius: "10px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                            color: "#F8FAFC",
                          }}
                          formatter={(val, name, item) => [
                            `${val}/100 (${item.payload.level} Risk)`,
                            "Risk Score",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="riskScore"
                          stroke="#A78BFA"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#purpleRiskGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Red and Green Donut Chart */}
              <div className="fintech-chart-card chart-donut">
                <div className="chart-card-header">
                  <div>
                    <div className="chart-title-tag">AUDIT BREAKDOWN</div>
                    <h3>Risk Classification</h3>
                  </div>
                </div>

                <div className="donut-chart-wrapper">
                  {totalTransactions === 0 ? (
                    <div className="chart-empty-state">No data available</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={donutData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={5}
                            stroke="none"
                          >
                            {donutData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0F172A",
                              borderColor: "#334155",
                              borderRadius: "10px",
                              color: "#F8FAFC",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="donut-legend">
                        <div className="legend-row">
                          <div className="legend-left">
                            <span className="legend-dot dot-green" />
                            <span>Legitimate</span>
                          </div>
                          <strong>{legitimateTransactions}</strong>
                        </div>
                        <div className="legend-row">
                          <div className="legend-left">
                            <span className="legend-dot dot-red" />
                            <span>Suspicious</span>
                          </div>
                          <strong className="text-red">{suspiciousTransactions}</strong>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* 3. Transaction Table with Red/Green Badges & Purple Hover Highlights */}
            <section className="fintech-table-card">
              <div className="table-card-header">
                <div>
                  <div className="chart-title-tag">LATEST RECORDINGS</div>
                  <h3>Recent Financial Activity</h3>
                </div>
                <button
                  className="table-link-btn"
                  onClick={() => setActivePage("Transactions")}
                >
                  <span>All Transactions</span>
                  <ArrowUpRight size={15} />
                </button>
              </div>

              <div className="table-responsive">
                <table className="fintech-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Counterparties</th>
                      <th>Amount</th>
                      <th>Payment Channel</th>
                      <th>Risk Score</th>
                      <th>Classification</th>
                      <th>Settlement</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.slice(0, 6).map((tx) => {
                      const isSuspicious =
                        tx.riskLevel === "High" ||
                        tx.riskLevel === "Medium" ||
                        (Number(tx.riskScore) || 0) >= 30;

                      return (
                        <tr key={tx._id} className={isSuspicious ? "row-suspicious" : "row-legitimate"}>
                          <td className="cell-id">
                            <span className="mono-badge">{tx.transactionId}</span>
                          </td>
                          <td className="cell-parties">
                            <span className="party-from">{tx.sender}</span>
                            <span className="party-arrow">→</span>
                            <span className="party-to">{tx.receiver}</span>
                          </td>
                          <td className="cell-amount">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td>
                            <span className="type-tag">{tx.transactionType}</span>
                          </td>
                          <td>
                            <div className="risk-score-display">
                              <span className="score-number">{tx.riskScore ?? 0}</span>
                              <span className="score-total">/100</span>
                            </div>
                          </td>
                          <td>
                            {isSuspicious ? (
                              <span className="badge-suspicious">
                                <ShieldAlert size={12} />
                                {tx.riskLevel || "Suspicious"}
                              </span>
                            ) : (
                              <span className="badge-legitimate">
                                <ShieldCheck size={12} />
                                Legitimate
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`status-pill-small status-${(tx.status || "completed").toLowerCase()}`}>
                              {tx.status || "Completed"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {transactions.length === 0 && !loading && (
                      <tr>
                        <td colSpan={7} className="table-empty-cell">
                          No transactions found in database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : activePage === "Transactions" ? (
          <Transactions />
        ) : activePage === "Fraud Detection" ? (
          <FraudDetection />
        ) : activePage === "Risk Analytics" ? (
          <RiskAnalytics />
        ) : activePage === "Investigations" ? (
          <Investigations />
        ) : (
          <div className="fintech-summary-card">
            <h2>{activePage}</h2>
            <p>Module loaded.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
