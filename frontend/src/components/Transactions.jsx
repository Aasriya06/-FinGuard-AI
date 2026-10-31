import "./Transactions.css";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  X,
} from "lucide-react";

import { TRANSACTIONS_API as API_URL } from "../config/api";

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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(API_URL);
      setTransactions(response.data);
    } catch (err) {
      setError("Unable to load transactions. Check your backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");

      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload);
      } else {
        await axios.post(API_URL, payload);
      }

      resetForm();
      await fetchTransactions();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save transaction."
      );
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction._id);

    setForm({
      transactionId: transaction.transactionId,
      sender: transaction.sender,
      receiver: transaction.receiver,
      amount: transaction.amount,
      transactionType: transaction.transactionType,
      status: transaction.status,
    });

    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    try {
      setError("");
      await axios.delete(`${API_URL}/${id}`);
      await fetchTransactions();
    } catch (err) {
      setError("Failed to delete transaction.");
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const query = search.toLowerCase();

    return (
      transaction.transactionId.toLowerCase().includes(query) ||
      transaction.sender.toLowerCase().includes(query) ||
      transaction.receiver.toLowerCase().includes(query) ||
      transaction.transactionType.toLowerCase().includes(query) ||
      transaction.status.toLowerCase().includes(query)
    );
  });

  return (
    <div className="transactions-page">
      <section className="transactions-header">
        <div>
          <h2>Transaction Management</h2>
          <p>
            Monitor, manage, and review financial transactions.
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

      <section className="transactions-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <button
          className="refresh-btn"
          onClick={fetchTransactions}
          title="Refresh transactions"
        >
          <RefreshCw size={18} />
        </button>
      </section>

      {error && <p className="transaction-error">{error}</p>}

      <section className="transactions-table-container">
        {loading ? (
          <p className="table-message">Loading transactions...</p>
        ) : filteredTransactions.length === 0 ? (
          <p className="table-message">No transactions found.</p>
        ) : (
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
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td>{transaction.transactionId}</td>
                  <td>{transaction.sender}</td>
                  <td>{transaction.receiver}</td>

                  <td className="amount-cell">
                    ₹{transaction.amount.toLocaleString("en-IN")}
                  </td>

                  <td>{transaction.transactionType}</td>

                  <td>
                    <span
                      className={`transaction-status ${transaction.status.toLowerCase()}`}
                    >
                      {transaction.status}
                    </span>
                  </td>

                  <td>{transaction.riskScore}/100</td>

                  <td>
                    <div className="table-actions">
                      <button
                        className="edit-btn"
                        title="Edit transaction"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="delete-btn"
                        title="Delete transaction"
                        onClick={() => handleDelete(transaction._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {showForm && (
        <div className="modal-overlay">
          <div className="transaction-modal">
            <div className="modal-header">
              <h2>
                {editingId ? "Edit Transaction" : "Add Transaction"}
              </h2>

              <button onClick={resetForm} className="close-btn">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  Transaction ID
                  <input
                    name="transactionId"
                    value={form.transactionId}
                    onChange={handleChange}
                    disabled={Boolean(editingId)}
                    required
                  />
                </label>

                <label>
                  Amount (₹)
                  <input
                    type="number"
                    name="amount"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Sender
                  <input
                    name="sender"
                    value={form.sender}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Receiver
                  <input
                    name="receiver"
                    value={form.receiver}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Transaction Type
                  <select
                    name="transactionType"
                    value={form.transactionType}
                    onChange={handleChange}
                  >
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Card</option>
                    <option>Wallet</option>
                  </select>
                </label>

                <label>
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option>Completed</option>
                    <option>Pending</option>
                    <option>Failed</option>
                  </select>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn">
                  {editingId ? "Save Changes" : "Create Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;