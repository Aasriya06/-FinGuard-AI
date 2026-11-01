import { useEffect, useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  CreditCard,
  PieChart as PieIcon,
  BarChart2,
} from "lucide-react";
import "./RiskAnalytics.css";
import { transactionsApi, extractErrorMessage } from "../config/api";

function RiskAnalytics() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await transactionsApi.getAll();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractErrorMessage(err, "Unable to load analytics data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Accurate Risk Level Classifications:
  // Low: 0-29, Medium: 30-59, High: 60-100
  const { lowRisk, mediumRisk, highRisk } = useMemo(() => {
    let low = 0;
    let med = 0;
    let high = 0;

    for (const t of transactions) {
      const score = Number(t.riskScore) || 0;
      const level = t.riskLevel;

      if (level === "High" || score >= 60) {
        high++;
      } else if (level === "Medium" || score >= 30) {
        med++;
      } else {
        low++;
      }
    }
    return { lowRisk: low, mediumRisk: med, highRisk: high };
  }, [transactions]);

  const riskPieData = useMemo(() => [
    { name: "Low Risk (0-29)", value: lowRisk },
    { name: "Medium Risk (30-59)", value: mediumRisk },
    { name: "High Risk (60-100)", value: highRisk },
  ], [lowRisk, mediumRisk, highRisk]);

  const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

  // Transaction Volume & Risk per Transaction Bar Chart
  const transactionChartData = useMemo(() => {
    return transactions.slice(0, 10).map((t) => ({
      id: t.transactionId,
      amount: Number(t.amount) || 0,
      riskScore: Number(t.riskScore) || 0,
      type: t.transactionType || "UPI",
    }));
  }, [transactions]);

  // Transaction Type Breakdown (UPI, Bank Transfer, Card, Wallet)
  const typeBreakdownData = useMemo(() => {
    const counts = { UPI: 0, "Bank Transfer": 0, Card: 0, Wallet: 0 };
    const volumes = { UPI: 0, "Bank Transfer": 0, Card: 0, Wallet: 0 };

    for (const t of transactions) {
      const type = t.transactionType || "UPI";
      const amt = Number(t.amount) || 0;
      if (counts[type] !== undefined) {
        counts[type]++;
        volumes[type] += amt;
      } else {
        counts[type] = 1;
        volumes[type] = amt;
      }
    }

    return Object.keys(counts).map((key) => ({
      type: key,
      count: counts[key],
      volume: volumes[key],
    }));
  }, [transactions]);

  const totalVolume = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const averageRisk = useMemo(() => {
    return transactions.length
      ? (
          transactions.reduce((sum, t) => sum + (Number(t.riskScore) || 0), 0) /
          transactions.length
        ).toFixed(1)
      : "0.0";
  }, [transactions]);

  const maxRiskScore = useMemo(() => {
    return transactions.length
      ? Math.max(...transactions.map((t) => Number(t.riskScore) || 0))
      : 0;
  }, [transactions]);

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const formatShortCurrency = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  return (
    <div className="risk-analytics">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h2>Risk Analytics & Intelligence</h2>
          <p>
            Statistical breakdown of transaction patterns, risk tier distributions, and payment methods.
          </p>
        </div>

        <button
          className="analytics-refresh-btn"
          onClick={fetchTransactions}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          Refresh Analytics
        </button>
      </div>

      {error && <p className="analytics-error-banner">{error}</p>}

      {/* KPI Cards */}
      <div className="analytics-stats">
        <div className="analytics-card">
          <div className="card-top">
            <p>Total Transactions</p>
            <TrendingUp size={18} className="text-accent" />
          </div>
          <h2>{transactions.length}</h2>
          <span>Recorded in database</span>
        </div>

        <div className="analytics-card">
          <div className="card-top">
            <p>Total Volume</p>
            <CreditCard size={18} className="text-accent" />
          </div>
          <h2>{formatCurrency(totalVolume)}</h2>
          <span>Cumulative transaction value</span>
        </div>

        <div className="analytics-card">
          <div className="card-top">
            <p>Average Risk Score</p>
            <ShieldAlert size={18} className="text-warning" />
          </div>
          <h2>{averageRisk}/100</h2>
          <span>Max Score: {maxRiskScore}/100</span>
        </div>

        <div className="analytics-card">
          <div className="card-top">
            <p>High-Risk Flags</p>
            <ShieldAlert size={18} className="text-danger" />
          </div>
          <h2>{highRisk}</h2>
          <span>{(transactions.length ? ((highRisk / transactions.length) * 100).toFixed(0) : 0)}% of total volume</span>
        </div>
      </div>

      {/* Charts Section */}
      {loading ? (
        <div className="analytics-loading">
          <RefreshCw size={28} className="spin text-accent" />
          <p>Computing analytics models...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="analytics-empty">
          <PieIcon size={38} className="text-muted" />
          <h3>No Transaction Data Available</h3>
          <p>Add transactions to view automated risk distribution charts.</p>
        </div>
      ) : (
        <div className="analytics-charts-grid">
          {/* Chart 1: Risk Distribution Pie Chart */}
          <div className="chart-card">
            <div className="chart-title">
              <PieIcon size={18} />
              <h3>Risk Tier Distribution</h3>
            </div>
            <p className="chart-subtitle">Low (0-29), Medium (30-59), High (60-100)</p>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={riskPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {riskPieData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Transaction Volume by Type */}
          <div className="chart-card">
            <div className="chart-title">
              <BarChart2 size={18} />
              <h3>Volume by Payment Method</h3>
            </div>
            <p className="chart-subtitle">Total amount processed per channel</p>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={typeBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="type" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={formatShortCurrency} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), "Volume"]}
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="volume" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Transaction Amount vs Risk Score */}
          <div className="chart-card span-two">
            <div className="chart-title">
              <TrendingUp size={18} />
              <h3>Transaction Risk Profile (Recent Transactions)</h3>
            </div>
            <p className="chart-subtitle">Direct comparison of transaction amount and computed risk score</p>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={transactionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="id" stroke="#94a3b8" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#38bdf8" fontSize={12} tickFormatter={formatShortCurrency} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#f59e0b" fontSize={12} />
                  <Tooltip
                    formatter={(val, name) => [
                      name === "amount" ? formatCurrency(val) : `${val}/100`,
                      name === "amount" ? "Amount" : "Risk Score",
                    ]}
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="amount" name="Amount (₹)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="riskScore" name="Risk Score (0-100)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiskAnalytics;