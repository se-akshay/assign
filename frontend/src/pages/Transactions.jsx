import { useState, useEffect } from "react";
import { transactionAPI } from "../utils/api";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState({
    month: new Date().toISOString().slice(0, 7),
    category: "all",
  });
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
    category: "",
  });

  const categories = [
    "food",
    "rent",
    "transport",
    "shopping",
    "subscriptions",
    "entertainment",
    "utilities",
    "healthcare",
    "others",
  ];

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await transactionAPI.getAll(filters);
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await transactionAPI.addManual(newTransaction);
      setNewTransaction({
        date: new Date().toISOString().slice(0, 10),
        description: "",
        amount: "",
        category: "",
      });
      setShowAddForm(false);
      fetchTransactions();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await transactionAPI.uploadCSV(formData);
      alert(`Successfully uploaded ${response.data.count} transactions`);
      fetchTransactions();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to upload file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await transactionAPI.delete(id);
      fetchTransactions();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to delete transaction");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date).toISOString().slice(0, 10);
    if (!groups[date]) groups[date] = [];
    groups[date].push(transaction);
    return groups;
  }, {});

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Track and manage your spending</p>
        </div>
        <div className="page-actions">
          <label className="btn btn-secondary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {uploading ? "Uploading..." : "Upload CSV"}
            <input
              type="file"
              accept=".csv"
              onChange={handleUploadCSV}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 4v16m8-8H4" />
            </svg>
            Add Transaction
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: "2rem" }}>
          <div className="card-header">
            <h2 className="card-title">New Transaction</h2>
            <button onClick={() => setShowAddForm(false)} className="btn-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="card-content">
            <form onSubmit={handleAddTransaction} className="transaction-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    id="date"
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        date: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="amount">Amount</label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        amount: e.target.value,
                      })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                  id="description"
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      description: e.target.value,
                    })
                  }
                  placeholder="Coffee at Starbucks"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category (optional)</label>
                <select
                  id="category"
                  value={newTransaction.category}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      category: e.target.value,
                    })
                  }
                >
                  <option value="">Auto-detect from description</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="filters">
            <div className="filter-group">
              <label htmlFor="month">Month</label>
              <input
                id="month"
                type="month"
                value={filters.month}
                onChange={(e) =>
                  setFilters({ ...filters, month: e.target.value })
                }
              />
            </div>
            <div className="filter-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="card-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : Object.keys(groupedTransactions).length > 0 ? (
            <div className="transactions-timeline">
              {Object.entries(groupedTransactions)
                .sort(([a], [b]) => new Date(b) - new Date(a))
                .map(([date, dayTransactions]) => (
                  <div key={date} className="timeline-group">
                    <div className="timeline-date">{formatDate(date)}</div>
                    <div className="timeline-items">
                      {dayTransactions.map((transaction) => (
                        <div key={transaction._id} className="timeline-item">
                          <div className="timeline-item-icon">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="timeline-item-content">
                            <div className="timeline-item-header">
                              <div>
                                <div className="timeline-item-description">
                                  {transaction.description}
                                </div>
                                <div className="timeline-item-category">
                                  {transaction.category}
                                </div>
                              </div>
                              <div className="timeline-item-amount">
                                {formatCurrency(transaction.amount)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(transaction._id)}
                            className="timeline-item-delete"
                            title="Delete transaction"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No transactions found</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn btn-primary"
              >
                Add your first transaction
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
