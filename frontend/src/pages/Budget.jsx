import { useState, useEffect } from "react";
import { budgetAPI } from "../utils/api";

const Budget = () => {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [totalBudget, setTotalBudget] = useState("");
  const [categoryBudgets, setCategoryBudgets] = useState({
    food: "",
    rent: "",
    transport: "",
    shopping: "",
    subscriptions: "",
    entertainment: "",
    utilities: "",
    healthcare: "",
    others: "",
  });

  const categories = [
    { key: "food", label: "Food & Dining" },
    { key: "rent", label: "Rent & Housing" },
    { key: "transport", label: "Transportation" },
    { key: "shopping", label: "Shopping" },
    { key: "subscriptions", label: "Subscriptions" },
    { key: "entertainment", label: "Entertainment" },
    { key: "utilities", label: "Utilities" },
    { key: "healthcare", label: "Healthcare" },
    { key: "others", label: "Others" },
  ];

  useEffect(() => {
    fetchBudget();
  }, [month]);

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const response = await budgetAPI.get(month);
      setBudget(response.data);

      if (response.data.budget) {
        setTotalBudget(response.data.budget.totalBudget || "");
        const catBudgets = {};
        categories.forEach((cat) => {
          catBudgets[cat.key] =
            response.data.budget.categoryBudgets?.[cat.key] || "";
        });
        setCategoryBudgets(catBudgets);
      }
    } catch (error) {
      console.error("Error fetching budget:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanCategoryBudgets = {};
      Object.keys(categoryBudgets).forEach((key) => {
        if (categoryBudgets[key]) {
          cleanCategoryBudgets[key] = parseFloat(categoryBudgets[key]);
        }
      });

      await budgetAPI.set({
        month,
        totalBudget: parseFloat(totalBudget) || 0,
        categoryBudgets: cleanCategoryBudgets,
      });

      fetchBudget();
      alert("Budget saved successfully!");
    } catch (error) {
      console.error("Budget save error:", error);
      alert(error.response?.data?.error || "Failed to save budget");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalCategoryBudgets = Object.values(categoryBudgets).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const budgetDifference =
    (parseFloat(totalBudget) || 0) - totalCategoryBudgets;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const totalSpending = budget?.spending?.total || 0;
  const budgetAmount = budget?.budget?.totalBudget || 0;
  const percentageUsed =
    budgetAmount > 0 ? (totalSpending / budgetAmount) * 100 : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Budget</h1>
          <p className="page-subtitle">Set and track your monthly budget</p>
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: "180px" }}>
          <label htmlFor="month">Month</label>
          <input
            id="month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
      </div>

      {budget?.alerts && budget.alerts.length > 0 && (
        <div className="alerts-section">
          {budget.alerts.map((alert, index) => (
            <div
              key={index}
              className={`alert ${
                alert.type === "danger" ? "alert-danger" : "alert-warning"
              }`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: "2rem" }}>
        <div className="stat-card">
          <div className="stat-label">Budget</div>
          <div className="stat-value">{formatCurrency(budgetAmount)}</div>
          <div className="stat-detail">Monthly limit</div>
        </div>

        <div className="stat-card stat-card-accent">
          <div className="stat-label">Spent</div>
          <div className="stat-value">{formatCurrency(totalSpending)}</div>
          <div className="stat-detail">{percentageUsed.toFixed(0)}% used</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Remaining</div>
          <div className="stat-value">
            {formatCurrency(Math.max(0, budgetAmount - totalSpending))}
          </div>
          <div className="stat-detail">Available to spend</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Budget Settings
          </h2>
        </div>
        <div className="card-content">
          <form onSubmit={handleSave} className="budget-form">
            <div className="form-section">
              <h3 className="form-section-title">Total Monthly Budget</h3>
              <div className="form-group">
                <label htmlFor="totalBudget">Amount</label>
                <input
                  id="totalBudget"
                  type="number"
                  step="0.01"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="5000.00"
                  required
                />
                <small>Set your total monthly spending limit</small>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Category Budgets</h3>
              <p className="form-section-description">
                Optional: Set specific budgets for each category
              </p>
              <div className="category-budgets">
                {categories.map((cat) => (
                  <div key={cat.key} className="category-budget-item">
                    <label htmlFor={cat.key}>{cat.label}</label>
                    <input
                      id={cat.key}
                      type="number"
                      step="0.01"
                      value={categoryBudgets[cat.key]}
                      onChange={(e) =>
                        setCategoryBudgets({
                          ...categoryBudgets,
                          [cat.key]: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>

              {totalCategoryBudgets > 0 && (
                <div className="budget-summary">
                  <div className="budget-summary-row">
                    <span>Total Category Budgets:</span>
                    <span>{formatCurrency(totalCategoryBudgets)}</span>
                  </div>
                  {budgetDifference !== 0 && (
                    <div
                      className={`budget-summary-row ${
                        budgetDifference < 0 ? "text-danger" : "text-success"
                      }`}
                    >
                      <span>
                        {budgetDifference < 0
                          ? "Over allocation:"
                          : "Unallocated:"}
                      </span>
                      <span>{formatCurrency(Math.abs(budgetDifference))}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  "Save Budget"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {budget?.spending?.byCategory && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Spending Progress
            </h2>
          </div>
          <div className="card-content">
            <div className="spending-progress">
              {categories.map((cat) => {
                const spent = budget.spending.byCategory[cat.key] || 0;
                const budgeted = categoryBudgets[cat.key]
                  ? parseFloat(categoryBudgets[cat.key])
                  : 0;
                const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
                const isOverBudget = percentage > 100;

                if (spent === 0 && budgeted === 0) return null;

                return (
                  <div key={cat.key} className="progress-item">
                    <div className="progress-header">
                      <span className="progress-label">{cat.label}</span>
                      <span className="progress-amount">
                        {formatCurrency(spent)}
                        {budgeted > 0 && ` / ${formatCurrency(budgeted)}`}
                      </span>
                    </div>
                    {budgeted > 0 && (
                      <>
                        <div className="progress-bar">
                          <div
                            className={`progress-bar-fill ${
                              isOverBudget ? "progress-over" : ""
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="progress-footer">
                          <span
                            className={
                              isOverBudget ? "text-danger" : "text-success"
                            }
                          >
                            {isOverBudget
                              ? `Over by ${formatCurrency(spent - budgeted)}`
                              : `${formatCurrency(budgeted - spent)} remaining`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget;
