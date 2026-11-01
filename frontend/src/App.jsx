import { useEffect, useState, useMemo } from "react";
import Transactions from "./components/Transactions";
import FraudDetection from "./components/FraudDetection";
import RiskAnalytics from "./components/RiskAnalytics";
import Investigations from "./components/Investigations";
import Reports from "./components/Reports";

import {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldAlert,
  BarChart2,
  UserCheck,
  FileText,
  Shield,
  Layers,
  TriangleAlert,
  BarChart3,
  ShieldCheck,
  Search,
  Bell,
  ArrowRight,
  RefreshCw,
  AlertCircle,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [systemHealth, setSystemHealth] = useState({
    status: "Checking...",
    database: "Checking...",
  });

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Transactions", icon: ArrowLeftRight },
    { name: "Fraud Detection", icon: ShieldAlert },
    { name: "Risk Analytics", icon: BarChart2 },
    { name: "Investigations", icon: UserCheck },
    { name: "Reports", icon: FileText },
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
    if (activePage === "Dashboard" || activePage === "Reports") {
      fetchTransactions();
    }
  }, [activePage]);

  // Dashboard metrics calculated dynamically from real database records
  const totalTransactions = transactions.length;

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

  const detectionRate = useMemo(() => {
    return totalTransactions > 0
      ? ((suspiciousTransactions / totalTransactions) * 100).toFixed(1)
      : "0.0";
  }, [totalTransactions, suspiciousTransactions]);

  const legitimateRate = useMemo(() => {
    return totalTransactions > 0
      ? ((legitimateTransactions / totalTransactions) * 100).toFixed(1)
      : "0.0";
  }, [totalTransactions, legitimateTransactions]);

  // Chronological Risk Trend for AreaChart
  const riskTrendData = useMemo(() => {
    if (!transactions.length) return [];
    const sorted = [...transactions].sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateA - dateB;
    });

    return sorted.slice(-6).map((tx, idx) => {
      let dateLabel = "";
      if (tx.timestamp) {
        const d = new Date(tx.timestamp);
        dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      if (!dateLabel || dateLabel === "Invalid Date") {
        dateLabel = `Oct ${25 + idx}`;
      }
      return {
        name: dateLabel,
        txnId: tx.transactionId,
        riskScore: Number(tx.riskScore) || 0,
        amount: Number(tx.amount) || 0,
        level: tx.riskLevel || (Number(tx.riskScore) >= 60 ? "High" : Number(tx.riskScore) >= 30 ? "Medium" : "Low"),
      };
    });
  }, [transactions]);

  // Donut Chart data: Suspicious vs Legitimate
  const donutData = useMemo(() => [
    { name: "Suspicious", value: suspiciousTransactions, color: "#F43F5E" },
    { name: "Legitimate", value: legitimateTransactions, color: "#10B981" },
  ], [suspiciousTransactions, legitimateTransactions]);

  const formatCurrency = (amount) => {
    return `$${Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const isOnline =
    systemHealth.status === "OK" && systemHealth.database === "Connected";

  // Filtered transactions for recent table if search term used
  const displayedRecentTxns = useMemo(() => {
    if (!searchTerm.trim()) return transactions.slice(0, 6);
    const q = searchTerm.toLowerCase();
    return transactions
      .filter(
        (tx) =>
          tx.transactionId?.toLowerCase().includes(q) ||
          tx.sender?.toLowerCase().includes(q) ||
          tx.receiver?.toLowerCase().includes(q) ||
          tx.transactionType?.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [transactions, searchTerm]);

  return (
    <div className="app">
      {/* Dark Navy Premium Fintech Sidebar */}
      <aside className="sidebar">
        <div className="brand" onClick={() => setActivePage("Dashboard")}>
          <div className="brand-logo-icon">
            <Shield size={20} color="#FFFFFF" className="shield-icon" />
          </div>
          <span className="brand-title">FinGuard AI</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.name;

            return (
              <button
                key={item.name}
                className={isActive ? "nav-item active" : "nav-item"}
                onClick={() => setActivePage(item.name)}
              >
                <Icon size={18} className="nav-icon" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Glowing Abstract Wave Mesh at Bottom Left */}
        <div className="sidebar-wave-container">
          <svg
            className="sidebar-wave-svg"
            viewBox="0 0 300 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="waveGradCyanPurple" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#6366F1" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="waveGradBlue" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              d="M-40,190 C40,140 120,180 200,120 C250,80 280,40 310,20"
              stroke="url(#waveGradCyanPurple)"
              strokeWidth="2.5"
            />
            <path
              d="M-30,195 C50,150 130,190 210,130 C260,90 290,50 320,30"
              stroke="url(#waveGradCyanPurple)"
              strokeWidth="2"
              strokeOpacity="0.75"
            />
            <path
              d="M-20,200 C60,160 140,200 220,140 C270,100 300,60 330,40"
              stroke="url(#waveGradBlue)"
              strokeWidth="1.8"
              strokeOpacity="0.6"
            />
            <path
              d="M-50,185 C30,130 110,170 190,110 C240,70 270,30 300,10"
              stroke="url(#waveGradCyanPurple)"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
          </svg>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="main-content">
        <header className="dashboard-topbar">
          <div className="topbar-title-block">
            <h1 className="page-heading">{activePage}</h1>
            <p className="page-subheading">
              {activePage === "Dashboard"
                ? "Real-time transaction monitoring and fraud detection"
                : activePage === "Transactions"
                ? "Full transaction history and audit ledger"
                : activePage === "Fraud Detection"
                ? "Rule-based scoring parameters and heuristics"
                : activePage === "Risk Analytics"
                ? "Macro portfolio analytics and risk metrics"
                : activePage === "Investigations"
                ? "Incident response and fraud case investigation"
                : "Regulatory dossiers and audit export center"}
            </p>
          </div>

          <div className="topbar-right-controls">
            <div className="search-pill-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <button
              className="icon-circle-btn"
              title={isOnline ? "Network Live • Atlas Connected" : "Connection Alert"}
              onClick={fetchTransactions}
            >
              <Bell size={17} className="bell-icon" />
              <span
                className="notification-badge-dot"
                style={{ background: isOnline ? "#10B981" : "#F43F5E" }}
              />
            </button>

            <div className="user-avatar-badge" title="Aasriya Mathukumilli">
              <span>AM</span>
            </div>
          </div>
        </header>

        {activePage === "Dashboard" ? (
          <div className="dashboard-body">
            {error && (
              <div className="dashboard-alert-banner">
                <AlertCircle size={18} color="#F43F5E" />
                <span className="alert-message"><strong>Alert:</strong> {error}</span>
                <button onClick={fetchTransactions} className="alert-retry-btn">
                  <RefreshCw size={12} className={loading ? "spin" : ""} /> Retry
                </button>
              </div>
            )}

            {/* 1. Four Summary Cards */}
            <section className="summary-cards-row">
              {/* Card 1: Total Transactions */}
              <div className="fintech-summary-card">
                <div className="card-icon-box icon-purple">
                  <Layers size={22} color="#A855F7" />
                </div>
                <div className="card-content">
                  <span className="card-stat-value">{totalTransactions}</span>
                  <span className="card-stat-label">Total Transactions</span>
                </div>
              </div>

              {/* Card 2: Suspicious Transactions */}
              <div className="fintech-summary-card">
                <div className="card-icon-box icon-red">
                  <TriangleAlert size={22} color="#EF4444" />
                </div>
                <div className="card-content">
                  <span className="card-stat-value">{suspiciousTransactions}</span>
                  <span className="card-stat-label">Suspicious</span>
                </div>
              </div>

              {/* Card 3: Average Risk Score */}
              <div className="fintech-summary-card">
                <div className="card-icon-box icon-cyan">
                  <BarChart3 size={22} color="#06B6D4" />
                </div>
                <div className="card-content">
                  <span className="card-stat-value">{averageRiskScore}</span>
                  <span className="card-stat-label">Avg Risk Score</span>
                </div>
              </div>

              {/* Card 4: Detection Rate */}
              <div className="fintech-summary-card">
                <div className="card-icon-box icon-green">
                  <ShieldCheck size={22} color="#10B981" />
                </div>
                <div className="card-content">
                  <span className="card-stat-value">{detectionRate}%</span>
                  <span className="card-stat-label">Detection Rate</span>
                </div>
              </div>
            </section>

            {/* 2. Middle Row: Two Charts */}
            <section className="dashboard-charts-row">
              {/* Left Chart: Transaction Risk Trend */}
              <div className="chart-card-box chart-trend-card">
                <h3 className="chart-title">Transaction Risk Trend</h3>
                <div className="chart-inner-wrap">
                  {riskTrendData.length === 0 ? (
                    <div className="chart-empty-state">No transaction records available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={230}>
                      <AreaChart
                        data={riskTrendData}
                        margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="riskTrendPurple" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#1E2638" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="#64748B"
                          fontSize={12}
                          tickLine={false}
                          axisLine={{ stroke: "#1E2638" }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 20, 40, 60, 80, 100]}
                          stroke="#64748B"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111726",
                            borderColor: "rgba(255, 255, 255, 0.08)",
                            borderRadius: "10px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                            color: "#F8FAFC",
                            fontSize: "12px",
                          }}
                          formatter={(val, name, item) => [
                            `${val}/100 (${item.payload.level} Risk)`,
                            "Risk Score",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="riskScore"
                          stroke="#8B5CF6"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#riskTrendPurple)"
                          dot={{
                            r: 5,
                            fill: "#FFFFFF",
                            stroke: "#8B5CF6",
                            strokeWidth: 2.5,
                          }}
                          activeDot={{
                            r: 7,
                            fill: "#FFFFFF",
                            stroke: "#A855F7",
                            strokeWidth: 3,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Right Chart: Transaction Distribution */}
              <div className="chart-card-box chart-dist-card">
                <h3 className="chart-title">Transaction Distribution</h3>
                <div className="distribution-body">
                  <div className="donut-canvas-container">
                    <ResponsiveContainer width={170} height={170}>
                      <PieChart>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={74}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {donutData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111726",
                            borderColor: "rgba(255, 255, 255, 0.08)",
                            borderRadius: "10px",
                            color: "#F8FAFC",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Center Total Count Overlay inside Donut */}
                    <div className="donut-center-overlay">
                      <span className="donut-center-number">{totalTransactions}</span>
                      <span className="donut-center-label">Transactions</span>
                    </div>
                  </div>

                  {/* Clean Legend matching screenshot */}
                  <div className="distribution-legend">
                    <div className="legend-item">
                      <div className="legend-indicator-group">
                        <span className="color-dot dot-red" />
                        <span className="legend-name">Suspicious ({suspiciousTransactions})</span>
                      </div>
                      <span className="legend-percentage">{detectionRate}%</span>
                    </div>

                    <div className="legend-item">
                      <div className="legend-indicator-group">
                        <span className="color-dot dot-green" />
                        <span className="legend-name">Legitimate ({legitimateTransactions})</span>
                      </div>
                      <span className="legend-percentage">{legitimateRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Bottom Table: Recent Transactions */}
            <section className="recent-transactions-card">
              <div className="table-header-bar">
                <h3 className="table-card-heading">Recent Transactions</h3>
                <button
                  className="view-all-link-btn"
                  onClick={() => setActivePage("Transactions")}
                >
                  <span>View All</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="table-scroll-container">
                <table className="recent-txn-table">
                  <thead>
                    <tr>
                      <th>Txn ID</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Risk Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRecentTxns.map((tx) => {
                      const score = Number(tx.riskScore) || 0;
                      const isSuspicious =
                        tx.riskLevel === "High" ||
                        tx.riskLevel === "Medium" ||
                        score >= 30;

                      return (
                        <tr key={tx._id || tx.transactionId}>
                          <td className="cell-txnid">{tx.transactionId}</td>
                          <td className="cell-amount">{formatCurrency(tx.amount)}</td>
                          <td className="cell-type">{tx.transactionType || "Transfer"}</td>
                          <td className="cell-risk-score">
                            <span
                              className={`risk-score-pill ${
                                score >= 60
                                  ? "score-pill-red"
                                  : score >= 30
                                  ? "score-pill-amber"
                                  : "score-pill-green"
                              }`}
                            >
                              {score}
                            </span>
                          </td>
                          <td className="cell-status">
                            {isSuspicious ? (
                              <span className="status-pill-badge badge-suspicious">
                                Suspicious
                              </span>
                            ) : (
                              <span className="status-pill-badge badge-legitimate">
                                Legitimate
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {displayedRecentTxns.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="empty-table-message">
                          No transactions found.
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
        ) : activePage === "Reports" ? (
          <Reports transactions={transactions} />
        ) : null}
      </main>
    </div>
  );
}

export default App;
