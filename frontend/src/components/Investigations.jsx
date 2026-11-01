import { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  X,
  FileText,
} from "lucide-react";
import "./Investigations.css";
import { transactionsApi, investigationsApi, extractErrorMessage } from "../config/api";

function Investigations() {
  const [transactions, setTransactions] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Open");
  const [priority, setPriority] = useState("Medium");

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [transactionsData, investigationsData] = await Promise.all([
        transactionsApi.getAll(),
        investigationsApi.getAll(),
      ]);

      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setInvestigations(Array.isArray(investigationsData) ? investigationsData : []);
    } catch (err) {
      setError(extractErrorMessage(err, "Unable to load investigation data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  // Suspicious transactions (Medium or High risk score >= 30)
  const suspiciousTransactions = useMemo(() => {
    return transactions.filter(
      (t) =>
        t.riskLevel === "Medium" ||
        t.riskLevel === "High" ||
        Number(t.riskScore) >= 30
    );
  }, [transactions]);

  // Combined Investigation Cases List (incorporating both active investigations and unassigned suspicious transactions)
  const combinedQueue = useMemo(() => {
    return suspiciousTransactions.map((tx) => {
      const inv = investigations.find(
        (item) => item.transaction && (item.transaction._id === tx._id || item.transaction === tx._id)
      );
      return {
        transaction: tx,
        investigation: inv || null,
        caseStatus: inv ? inv.status : "Not Started",
        priority: inv ? inv.priority : (tx.riskLevel === "High" ? "High" : "Medium"),
        notes: inv ? inv.notes : "",
        updatedAt: inv ? inv.updatedAt : tx.updatedAt,
      };
    });
  }, [suspiciousTransactions, investigations]);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return combinedQueue.filter((item) => {
      const q = search.toLowerCase().trim();
      const tx = item.transaction;
      const matchesSearch =
        !q ||
        (tx.transactionId && tx.transactionId.toLowerCase().includes(q)) ||
        (tx.sender && tx.sender.toLowerCase().includes(q)) ||
        (tx.receiver && tx.receiver.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      const matchesStatus =
        filterStatus === "ALL" || item.caseStatus === filterStatus;

      const matchesPriority =
        filterPriority === "ALL" || item.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [combinedQueue, search, filterStatus, filterPriority]);

  const openCase = (item) => {
    setSelectedCase(item);
    setNotes(item.investigation?.notes || "");
    setStatus(item.investigation?.status || "Open");
    setPriority(
      item.investigation?.priority ||
        (item.transaction.riskLevel === "High" ? "High" : "Medium")
    );
  };

  const saveInvestigation = async () => {
    if (!selectedCase) return;

    try {
      setSaving(true);
      setError("");

      if (selectedCase.investigation) {
        await investigationsApi.update(selectedCase.investigation._id, {
          notes: notes.trim(),
          status,
          priority,
        });
        showSuccess(`Investigation updated to ${status}.`);
      } else {
        await investigationsApi.create({
          transactionId: selectedCase.transaction._id,
          notes: notes.trim(),
          status,
          priority,
        });
        showSuccess(`New investigation created and marked as ${status}.`);
      }

      setSelectedCase(null);
      await fetchData();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to save investigation."));
    } finally {
      setSaving(false);
    }
  };

  const openCount = investigations.filter((i) => i.status === "Open").length;
  const progressCount = investigations.filter((i) => i.status === "In Progress").length;
  const resolvedCount = investigations.filter((i) => i.status === "Resolved").length;

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amt) || 0);
  };

  return (
    <div className="investigations-page">
      {/* Header */}
      <div className="investigations-header">
        <div>
          <h2>Case Investigations & Audit</h2>
          <p>
            Investigate suspicious activities, document findings, assign priorities, and manage fraud case lifecycles.
          </p>
        </div>

        <button className="inv-refresh-btn" onClick={fetchData} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          Refresh Cases
        </button>
      </div>

      {successMessage && (
        <div className="inv-success-banner">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && <p className="investigation-error">{error}</p>}

      {/* KPI Stats */}
      <div className="investigation-stats">
        <div className="investigation-stat-card">
          <p>Flagged Queue</p>
          <h2>{suspiciousTransactions.length}</h2>
          <span>Transactions needing review</span>
        </div>

        <div className="investigation-stat-card">
          <p>Open Cases</p>
          <h2>{openCount}</h2>
          <span>Pending initial review</span>
        </div>

        <div className="investigation-stat-card">
          <p>In Progress</p>
          <h2>{progressCount}</h2>
          <span>Under active investigation</span>
        </div>

        <div className="investigation-stat-card">
          <p>Resolved Cases</p>
          <h2>{resolvedCount}</h2>
          <span>Closed investigations</span>
        </div>
      </div>

      {/* Main Panel */}
      <div className="investigation-panel">
        <div className="inv-toolbar">
          <div className="inv-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by ID, sender, receiver, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-search" onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="inv-filters">
            <div className="inv-filter-item">
              <Filter size={14} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                title="Filter by Case Status"
              >
                <option value="ALL">All Case Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="inv-filter-item">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                title="Filter by Priority"
              >
                <option value="ALL">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Queue Table */}
        {loading ? (
          <div className="inv-empty-state">
            <RefreshCw size={26} className="spin text-accent" />
            <p>Loading case investigation queue...</p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="inv-empty-state">
            <CheckCircle2 size={36} color="#4ade80" />
            <h3>No Cases Found</h3>
            <p>No transactions match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="investigation-table-wrapper">
            <table className="investigation-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Counterparties</th>
                  <th>Amount</th>
                  <th>Risk Assessment</th>
                  <th>Case Status</th>
                  <th>Priority</th>
                  <th>Investigation Notes</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredQueue.map((item) => {
                  const tx = item.transaction;
                  const hasCase = Boolean(item.investigation);

                  return (
                    <tr key={tx._id}>
                      <td className="inv-tx-id">
                        <span>{tx.transactionId}</span>
                      </td>
                      <td>
                        <div className="counterparties">
                          <span>From: {tx.sender}</span>
                          <span>To: {tx.receiver}</span>
                        </div>
                      </td>
                      <td className="amount-cell">{formatCurrency(tx.amount)}</td>
                      <td>
                        <div className="risk-pill-wrap">
                          <span className={`risk-pill ${(tx.riskLevel || "Low").toLowerCase()}`}>
                            {tx.riskLevel || "Low"} ({tx.riskScore ?? 0}/100)
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`case-status-badge status-${item.caseStatus.toLowerCase().replace(/\s+/g, "-")}`}>
                          {item.caseStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-badge priority-${item.priority.toLowerCase()}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="notes-preview-cell">
                        {item.notes ? (
                          <span className="notes-snippet" title={item.notes}>
                            {item.notes.length > 50 ? `${item.notes.substring(0, 50)}...` : item.notes}
                          </span>
                        ) : (
                          <span className="no-notes">No notes logged</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="investigate-btn"
                          onClick={() => openCase(item)}
                        >
                          <FileText size={14} />
                          {hasCase ? "View / Update" : "Open Case"}
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

      {/* CASE MANAGEMENT MODAL */}
      {selectedCase && (
        <div className="investigation-modal-overlay" onClick={() => !saving && setSelectedCase(null)}>
          <div className="investigation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                Case Investigation: {selectedCase.transaction.transactionId}
              </h2>
              <button
                onClick={() => !saving && setSelectedCase(null)}
                className="close-btn"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="inv-case-summary">
              <div>
                <span className="summary-label">Transaction Amount</span>
                <h4>{formatCurrency(selectedCase.transaction.amount)}</h4>
              </div>
              <div>
                <span className="summary-label">Risk Rating</span>
                <p>
                  <strong>{selectedCase.transaction.riskLevel || "Low"}</strong> ({selectedCase.transaction.riskScore ?? 0}/100)
                </p>
              </div>
              <div>
                <span className="summary-label">Payment Type</span>
                <p>{selectedCase.transaction.transactionType}</p>
              </div>
            </div>

            <div className="inv-reasons-block">
              <strong>Fraud Detection Flags:</strong>
              {selectedCase.transaction.reasons && selectedCase.transaction.reasons.length > 0 ? (
                <ul>
                  {selectedCase.transaction.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="no-reasons-note">No specific heuristic triggers on record.</p>
              )}
            </div>

            <div className="inv-form-group">
              <label>Investigation Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving}
              >
                <option value="Open">Open (Pending review)</option>
                <option value="In Progress">In Progress (Auditing)</option>
                <option value="Resolved">Resolved (Concluded)</option>
              </select>
            </div>

            <div className="inv-form-group">
              <label>Investigation Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={saving}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority (Urgent)</option>
              </select>
            </div>

            <div className="inv-form-group">
              <label>Investigation Findings & Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Document verification steps, customer contact, KYC verification, or case outcome..."
                rows={5}
                disabled={saving}
              />
            </div>

            <div className="investigation-modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setSelectedCase(null)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="save-investigation-btn"
                onClick={saveInvestigation}
                disabled={saving}
              >
                {saving ? "Saving Changes..." : selectedCase.investigation ? "Update Investigation" : "Create Investigation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Investigations;