import { useEffect, useState } from "react";
import axios from "axios";
import "./Investigations.css";

import { API_URL as API } from "../config/api";

function Investigations() {
  const [transactions, setTransactions] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Open");
  const [priority, setPriority] = useState("Medium");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [transactionsRes, investigationsRes] =
        await Promise.all([
          axios.get(`${API}/transactions`),
          axios.get(`${API}/investigations`),
        ]);

      setTransactions(transactionsRes.data);
      setInvestigations(investigationsRes.data);
    } catch (err) {
      setError("Unable to load investigation data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const suspiciousTransactions = transactions.filter(
    (t) =>
      t.riskLevel === "Medium" ||
      t.riskLevel === "High" ||
      Number(t.riskScore) >= 30
  );

  const openCase = (transaction) => {
    const existing = investigations.find(
      (item) => item.transaction?._id === transaction._id
    );

    setSelectedCase({
      transaction,
      investigation: existing || null,
    });

    setNotes(existing?.notes || "");
    setStatus(existing?.status || "Open");
    setPriority(
      existing?.priority ||
        (transaction.riskLevel === "High" ? "High" : "Medium")
    );
  };

  const saveInvestigation = async () => {
    if (!selectedCase) return;

    try {
      setSaving(true);
      setError("");

      if (selectedCase.investigation) {
        await axios.put(
          `${API}/investigations/${selectedCase.investigation._id}`,
          { notes, status, priority }
        );
      } else {
        await axios.post(`${API}/investigations`, {
          transactionId: selectedCase.transaction._id,
          notes,
          priority,
        });
      }

      setSelectedCase(null);
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save investigation."
      );
    } finally {
      setSaving(false);
    }
  };

  const openCount = investigations.filter(
    (i) => i.status === "Open"
  ).length;

  const progressCount = investigations.filter(
    (i) => i.status === "In Progress"
  ).length;

  const resolvedCount = investigations.filter(
    (i) => i.status === "Resolved"
  ).length;

  return (
    <div className="investigations-page">
      <div className="investigations-header">
        <div>
          <h2>Investigation Management</h2>
          <p>
            Review suspicious transactions and manage fraud cases.
          </p>
        </div>

        <button onClick={fetchData}>Refresh</button>
      </div>

      {error && <p className="investigation-error">{error}</p>}

      <div className="investigation-stats">
        <div className="investigation-stat-card">
          <p>Suspicious Transactions</p>
          <h2>{suspiciousTransactions.length}</h2>
        </div>

        <div className="investigation-stat-card">
          <p>Open Cases</p>
          <h2>{openCount}</h2>
        </div>

        <div className="investigation-stat-card">
          <p>In Progress</p>
          <h2>{progressCount}</h2>
        </div>

        <div className="investigation-stat-card">
          <p>Resolved Cases</p>
          <h2>{resolvedCount}</h2>
        </div>
      </div>

      <div className="investigation-panel">
        <h3>Suspicious Transaction Queue</h3>

        {loading ? (
          <p>Loading investigations...</p>
        ) : suspiciousTransactions.length === 0 ? (
          <p>No suspicious transactions found.</p>
        ) : (
          <div className="investigation-table-wrapper">
            <table className="investigation-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Amount</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Case Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {suspiciousTransactions.map((t) => {
                  const existing = investigations.find(
                    (i) => i.transaction?._id === t._id
                  );

                  return (
                    <tr key={t._id}>
                      <td>{t.transactionId}</td>
                      <td>{t.sender}</td>
                      <td>{t.receiver}</td>
                      <td>
                        ₹{Number(t.amount).toLocaleString("en-IN")}
                      </td>
                      <td>{t.riskScore || 0}/100</td>
                      <td>{t.riskLevel || "Low"}</td>
                      <td>{existing?.status || "Not Started"}</td>
                      <td>
                        <button
                          className="investigate-btn"
                          onClick={() => openCase(t)}
                        >
                          {existing ? "View Case" : "Investigate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCase && (
        <div className="investigation-modal-overlay">
          <div className="investigation-modal">
            <h2>
              Investigation: {selectedCase.transaction.transactionId}
            </h2>

            <p>
              Risk Score: {selectedCase.transaction.riskScore}/100
            </p>

            <label>Investigation Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>

            <label>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <label>Investigation Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter investigation findings..."
              rows={5}
            />

            <div className="investigation-modal-actions">
              <button
                onClick={() => setSelectedCase(null)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="save-investigation-btn"
                onClick={saveInvestigation}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Investigation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Investigations;