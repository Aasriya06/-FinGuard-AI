import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  X,
  Eye,
  AlertCircle,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import "./Transactions.css";
import { transactionsApi, extractErrorMessage } from "../config/api";

const initialForm = {
  transactionId: "",
  sender: "",
  receiver: "",
  amount: "",
  transactionType: "UPI",
  status: "Completed",
};

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await transactionsApi.getAll();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractErrorMessage(err, "Unable to load transactions. Check your backend connection."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setFormErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.transactionId || !form.transactionId.trim()) {
      errors.transactionId = "Transaction ID is required";
    }
    if (!form.sender || !form.sender.trim()) {
      errors.sender = "Sender name is required";
    }
    if (!form.receiver || !form.receiver.trim()) {
      errors.receiver = "Receiver name is required";
    }
    const numAmount = Number(form.amount);
    if (!form.amount || isNaN(numAmount) || numAmount <= 0) {
      errors.amount = "Amount must be a positive number greater than ₹0.00";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        transactionId: form.transactionId.trim(),
        sender: form.sender.trim(),
        receiver: form.receiver.trim(),
        amount: Number(form.amount),
        transactionType: form.transactionType,
        status: form.status,
      };

      if (editingId) {
        await transactionsApi.update(editingId, payload);
        showSuccess(`Transaction ${payload.transactionId} updated successfully.`);
      } else {
        await transactionsApi.create(payload);
        showSuccess(`Transaction ${payload.transactionId} created successfully.`);
      }

      resetForm();
      await fetchTransactions();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to save transaction."));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction._id);
    setForm({
      transactionId: transaction.transactionId || "",
      sender: transaction.sender || "",
      receiver: transaction.receiver || "",
      amount: transaction.amount || "",
      transactionType: transaction.transactionType || "UPI",
      status: transaction.status || "Completed",
    });
    setFormErrors({});
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deletingTransaction) return;
    try {
      setDeleting(true);
      setError("");
      await transactionsApi.delete(deletingTransaction._id);
      showSuccess(`Transaction ${deletingTransaction.transactionId} was successfully deleted.`);
      setDeletingTransaction(null);
      await fetchTransactions();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to delete transaction."));
    } finally {
      setDeleting(false);
    }
  };

  // Filtered and searched list
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (tx.transactionId && tx.transactionId.toLowerCase().includes(q)) ||
        (tx.sender && tx.sender.toLowerCase().includes(q)) ||
        (tx.receiver && tx.receiver.toLowerCase().includes(q));

      const matchesRisk =
        filterRisk === "ALL" || (tx.riskLevel || "Low") === filterRisk;

      const matchesType =
        filterType === "ALL" || (tx.transactionType || "UPI") === filterType;

      const matchesStatus =
        filterStatus === "ALL" || (tx.status || "Completed") === filterStatus;

      return matchesSearch && matchesRisk && matchesType && matchesStatus;
    });
  }, [transactions, search, filterRisk, filterType, filterStatus]);

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amt) || 0);
  };

  const getRiskBadgeClass = (level, score) => {
    const lvl = (level || "").toLowerCase();
    if (lvl === "high" || score >= 60) return "badge-risk-high";
    if (lvl === "medium" || score >= 30) return "badge-risk-medium";
    return "badge-risk-low";
  };

  const getStatusIcon = (st) => {
    switch (st) {
      case "Completed":
        return <CheckCircle2 size={13} />;
      case "Pending":
        return <Clock size={13} />;
      case "Failed":
        return <XCircle size={13} />;
      default:
        return null;
    }
  };

  return (
    <div className="transactions-page">
      {/* Page Header */}
      <section className="transactions-header">
        <div>
          <h2>Transaction Management</h2>
          <p>
            Monitor, filter, inspect, and manage financial transactions with real-time risk scoring.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={18} />
          Add Transaction
        </button>
      </section>

      {/* Notifications */}
      {successMessage && (
        <div className="success-banner">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="banner-dismiss" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Toolbar: Search and Multi-Criteria Filters */}
      <section className="transactions-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by ID, sender, receiver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch("")}>
              <X size={15} />
            </button>
          )}
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <Filter size={15} className="filter-icon" />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              title="Filter by Risk Level"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="Low">Low Risk (0-29)</option>
              <option value="Medium">Medium Risk (30-59)</option>
              <option value="High">High Risk (60-100)</option>
            </select>
          </div>

          <div className="filter-item">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              title="Filter by Type"
            >
              <option value="ALL">All Types</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
              <option value="Wallet">Wallet</option>
            </select>
          </div>

          <div className="filter-item">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              title="Filter by Status"
            >
              <option value="ALL">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <button
            className="refresh-btn"
            onClick={fetchTransactions}
            title="Refresh transactions"
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
        </div>
      </section>

      {/* Results Count Summary */}
      <div className="results-summary">
        Showing <strong>{filteredTransactions.length}</strong> of{" "}
        <strong>{transactions.length}</strong> total transactions
        {(search || filterRisk !== "ALL" || filterType !== "ALL" || filterStatus !== "ALL") && (
          <button
            className="clear-all-filters"
            onClick={() => {
              setSearch("");
              setFilterRisk("ALL");
              setFilterType("ALL");
              setFilterStatus("ALL");
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <section className="transactions-table-container">
        {loading ? (
          <div className="table-state-box">
            <RefreshCw size={28} className="spin text-accent" />
            <p>Loading transactions from database...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="table-state-box">
            <ShieldAlert size={36} className="text-muted" />
            <h3>No Transactions Match Criteria</h3>
            <p>Try clearing filters or search terms.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((tx) => {
                  const riskBadgeClass = getRiskBadgeClass(tx.riskLevel, tx.riskScore);
                  const isFraud = tx.isFraudulent;

                  return (
                    <tr key={tx._id} className={isFraud ? "row-fraud" : ""}>
                      <td className="tx-id-cell">
                        <span className="mono-badge">{tx.transactionId}</span>
                        {isFraud && <span className="fraud-tag">FRAUD</span>}
                      </td>
                      <td>{tx.sender}</td>
                      <td>{tx.receiver}</td>
                      <td className="amount-cell">{formatCurrency(tx.amount)}</td>
                      <td>
                        <span className="type-badge">{tx.transactionType}</span>
                      </td>
                      <td>
                        <span className={`status-badge status-${(tx.status || "completed").toLowerCase()}`}>
                          {getStatusIcon(tx.status)}
                          {tx.status}
                        </span>
                      </td>
                      <td>
                        <div className="score-indicator">
                          <span className="score-num">{tx.riskScore ?? 0}</span>
                          <span className="score-max">/100</span>
                        </div>
                      </td>
                      <td>
                        <span className={`risk-badge ${riskBadgeClass}`}>
                          {tx.riskLevel || "Low"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="action-btn view-btn"
                            title="View transaction details"
                            onClick={() => setViewingTransaction(tx)}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            className="action-btn edit-btn"
                            title="Edit transaction"
                            onClick={() => handleEdit(tx)}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            className="action-btn delete-btn"
                            title="Delete transaction"
                            onClick={() => setDeletingTransaction(tx)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CREATE / EDIT TRANSACTION MODAL */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="transaction-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Edit Transaction" : "Add New Transaction"}</h2>
              <button onClick={resetForm} className="close-btn" title="Close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <label>
                  <span>Transaction ID *</span>
                  <input
                    name="transactionId"
                    value={form.transactionId}
                    onChange={handleChange}
                    disabled={Boolean(editingId)}
                    placeholder="e.g. TXN9001"
                    className={formErrors.transactionId ? "input-error" : ""}
                    required
                  />
                  {formErrors.transactionId && (
                    <span className="field-error">{formErrors.transactionId}</span>
                  )}
                </label>

                <label>
                  <span>Amount (₹) *</span>
                  <input
                    type="number"
                    name="amount"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="e.g. 75000"
                    className={formErrors.amount ? "input-error" : ""}
                    required
                  />
                  {formErrors.amount && (
                    <span className="field-error">{formErrors.amount}</span>
                  )}
                </label>

                <label>
                  <span>Sender Name *</span>
                  <input
                    name="sender"
                    value={form.sender}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    className={formErrors.sender ? "input-error" : ""}
                    required
                  />
                  {formErrors.sender && (
                    <span className="field-error">{formErrors.sender}</span>
                  )}
                </label>

                <label>
                  <span>Receiver Name *</span>
                  <input
                    name="receiver"
                    value={form.receiver}
                    onChange={handleChange}
                    placeholder="e.g. Priya Reddy"
                    className={formErrors.receiver ? "input-error" : ""}
                    required
                  />
                  {formErrors.receiver && (
                    <span className="field-error">{formErrors.receiver}</span>
                  )}
                </label>

                <label>
                  <span>Transaction Type *</span>
                  <select
                    name="transactionType"
                    value={form.transactionType}
                    onChange={handleChange}
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Wallet">Wallet</option>
                  </select>
                </label>

                <label>
                  <span>Status *</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW TRANSACTION DETAILS MODAL */}
      {viewingTransaction && (
        <div className="modal-overlay" onClick={() => setViewingTransaction(null)}>
          <div className="transaction-modal details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transaction Details</h2>
              <button
                onClick={() => setViewingTransaction(null)}
                className="close-btn"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="details-content">
              <div className="details-banner">
                <div>
                  <span className="details-tx-id">{viewingTransaction.transactionId}</span>
                  <h3>{formatCurrency(viewingTransaction.amount)}</h3>
                </div>
                <div className="details-risk-block">
                  <span className={`risk-badge ${getRiskBadgeClass(viewingTransaction.riskLevel, viewingTransaction.riskScore)}`}>
                    {viewingTransaction.riskLevel || "Low"} Risk ({viewingTransaction.riskScore || 0}/100)
                  </span>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-row">
                  <span className="detail-label">Sender:</span>
                  <span className="detail-value">{viewingTransaction.sender}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Receiver:</span>
                  <span className="detail-value">{viewingTransaction.receiver}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Method:</span>
                  <span className="detail-value">{viewingTransaction.transactionType}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge status-${(viewingTransaction.status || "completed").toLowerCase()}`}>
                    {viewingTransaction.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Fraud Status:</span>
                  <span className="detail-value">
                    {viewingTransaction.isFraudulent ? "Confirmed Fraud" : "Legitimate / Unconfirmed"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Timestamp:</span>
                  <span className="detail-value">
                    {viewingTransaction.createdAt
                      ? new Date(viewingTransaction.createdAt).toLocaleString("en-IN")
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="detection-reasons-card">
                <h4>Fraud Detection Risk Reasons:</h4>
                {viewingTransaction.reasons && viewingTransaction.reasons.length > 0 ? (
                  <ul className="reasons-list">
                    {viewingTransaction.reasons.map((r, i) => (
                      <li key={i}>
                        <ShieldAlert size={14} className="text-warning" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-reasons-text">
                    No risk triggers detected. Standard transaction activity.
                  </p>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setViewingTransaction(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  const tx = viewingTransaction;
                  setViewingTransaction(null);
                  handleEdit(tx);
                }}
              >
                <Pencil size={15} /> Edit This Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingTransaction && (
        <div className="modal-overlay" onClick={() => !deleting && setDeletingTransaction(null)}>
          <div className="transaction-modal delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button
                onClick={() => !deleting && setDeletingTransaction(null)}
                className="close-btn"
                disabled={deleting}
              >
                <X size={20} />
              </button>
            </div>

            <div className="delete-dialog-body">
              <AlertCircle size={40} className="text-danger" />
              <p>
                Are you sure you want to permanently delete transaction{" "}
                <strong>{deletingTransaction.transactionId}</strong> ({formatCurrency(deletingTransaction.amount)})?
              </p>
              <p className="delete-subtext">
                Any associated investigation records will also be safely removed to maintain reference integrity. This action cannot be undone.
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setDeletingTransaction(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-btn"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;