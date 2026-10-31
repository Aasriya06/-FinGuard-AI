import "./RiskAnalytics.css";
import { useEffect, useState } from "react";
import axios from "axios";
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

import { TRANSACTIONS_API as API_URL } from "../config/api";

function RiskAnalytics() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(API_URL);
      setTransactions(response.data);
    } catch (err) {
      setError("Unable to load analytics data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const lowRisk = transactions.filter(
    (t) => t.riskLevel === "Low" || (!t.riskLevel && t.riskScore < 30)
  ).length;

  const mediumRisk = transactions.filter(
    (t) => t.riskLevel === "Medium" || (!t.riskLevel && t.riskScore >= 30 && t.riskScore < 70)
  ).length;

  const highRisk = transactions.filter(
    (t) => t.riskLevel === "High" || (!t.riskLevel && t.riskScore >= 70)
  ).length;

  const riskData = [
    { name: "Low Risk", value: lowRisk },
    { name: "Medium Risk", value: mediumRisk },
    { name: "High Risk", value: highRisk },
  ];

  const COLORS = ["#22c55e", "#facc15", "#ef4444"];

  const transactionData = transactions.map((t) => ({
    name: t.transactionId,
    amount: Number(t.amount) || 0,
    riskScore: Number(t.riskScore) || 0,
  }));

  const totalVolume = transactions.reduce(
    (sum, t) => sum + (Number(t.amount) || 0),
    0
  );

  const averageRisk = transactions.length
    ? (
        transactions.reduce(
          (sum, t) => sum + (Number(t.riskScore) || 0),
          0
        ) / transactions.length
      ).toFixed(1)
    : "0.0";

  if (loading) {
    return <p>Loading risk analytics...</p>;
  }

  return (
    <div className="risk-analytics">
      <div className="analytics-header">
        <div>
          <h2>Risk Analytics Overview</h2>
          <p>Analyze transaction patterns and financial risk.</p>
        </div>

        <button onClick={fetchTransactions}>Refresh</button>
      </div>

      {error && <p style={{ color: "#ef4444" }}>{error}</p>}

      <div className="analytics-stats">
        <div className="analytics-card">
          <p>Total Transactions</p>
          <h2>{transactions.length}</h2>
        </div>

        <div className="analytics-card">
          <p>Total Transaction Volume</p>
          <h2>₹{totalVolume.toLocaleString("en-IN")}</h2>
        </div>

        <div className="analytics-card">
          <p>Average Risk Score</p>
          <h2>{averageRisk}/100</h2>
        </div>

        <div className="analytics-card">
          <p>High-Risk Transactions</p>
          <h2>{highRisk}</h2>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-card">
          <h3>Risk Distribution</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {riskData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[index]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Transaction Volume</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#38bdf8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Transaction Risk Scores</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="riskScore" fill="#facc15" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default RiskAnalytics;