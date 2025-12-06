import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { transactionAPI, budgetAPI, analysisAPI } from "../utils/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, transactionsRes, budgetRes] = await Promise.all([
        transactionAPI.getStats({ month: currentMonth }),
        transactionAPI.getAll({ month: currentMonth }),
        budgetAPI.get(currentMonth),
      ]);

      console.log("=== API RESPONSES ===");
      console.log("Stats response:", statsRes.data);
      console.log("Transactions response:", transactionsRes.data);
      console.log("Budget response:", budgetRes.data);

      setStats(statsRes.data);
      setTransactions(transactionsRes.data);
      setBudget(budgetRes.data);

      // Try to fetch analysis for current month
      try {
        const analysisRes = await analysisAPI.get();
        setAnalysis(analysisRes.data);
      } catch (err) {
        console.log(
          "No analysis found, will auto-generate if transactions exist"
        );
        // Auto-generate analysis if transactions exist
        if (transactionsRes.data.length > 0) {
          setTimeout(() => generateAnalysis(), 1000);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    setGeneratingAnalysis(true);
    try {
      const response = await analysisAPI.generate();
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error("Error generating analysis:", error);
      alert(error.response?.data?.error || "Failed to generate analysis");
    } finally {
      setGeneratingAnalysis(false);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    const options = { month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const totalSpending = stats?.totalSpending || 0;
  const totalBudget = budget?.budget?.totalBudget || 0;
  const transactionCount = stats?.transactionCount || 0;
  const percentageUsed =
    totalBudget > 0 ? (totalSpending / totalBudget) * 100 : 0;
  const categoryStats = stats?.stats || [];

  console.log("=== CALCULATED VALUES ===");
  console.log("Total spending:", totalSpending);
  console.log("Total budget:", totalBudget);
  console.log("Transaction count:", transactionCount);
  console.log("Category stats:", categoryStats);
  console.log("Stats object:", stats);
  console.log("Budget object:", budget);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
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

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">{formatCurrency(totalSpending)}</div>
          <div className="stat-detail">{transactionCount} transactions</div>
        </div>

        <div className="stat-card stat-card-accent">
          <div className="stat-label">Budget</div>
          <div className="stat-value">{formatCurrency(totalBudget)}</div>
          <div className="stat-detail">
            {totalBudget > 0 ? `${percentageUsed.toFixed(0)}% used` : "Not set"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Remaining</div>
          <div className="stat-value">
            {formatCurrency(Math.max(0, totalBudget - totalSpending))}
          </div>
          <div className="stat-detail">
            {totalBudget > 0 ? "This month" : "Set a budget"}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Insights
            </h2>
            {transactions.length > 0 && (
              <button
                onClick={generateAnalysis}
                disabled={generatingAnalysis}
                className="btn-icon"
                title="Regenerate AI Insights"
              >
                <svg
                  className={generatingAnalysis ? "spin" : ""}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
          <div className="card-content">
            {analysis ? (
              <div className="analysis-content">
                <div className="analysis-summary">{analysis.summary}</div>
                {analysis.savingGoal > 0 && (
                  <div className="saving-goal">
                    <div className="saving-goal-label">
                      Suggested Saving Goal
                    </div>
                    <div className="saving-goal-value">
                      {formatCurrency(analysis.savingGoal)}/month
                    </div>
                  </div>
                )}
                {analysis.suggestions && analysis.suggestions.length > 0 && (
                  <div className="suggestions">
                    <div className="suggestions-label">Quick Tips</div>
                    <ul className="suggestions-list">
                      {analysis.suggestions
                        .slice(0, 3)
                        .map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : transactions.length === 0 ? (
              <div className="empty-state">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p>Add transactions to get AI-powered insights</p>
              </div>
            ) : (
              <div className="empty-state">
                <button
                  onClick={generateAnalysis}
                  disabled={generatingAnalysis}
                  className="btn btn-primary"
                >
                  {generatingAnalysis ? "Generating..." : "Generate Insights"}
                </button>
              </div>
            )}
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
                <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Spending by Category
            </h2>
          </div>
          <div className="card-content">
            {categoryStats.length > 0 ? (
              <div className="category-chart-container">
                <svg viewBox="0 0 200 200" className="category-chart">
                  {(() => {
                    const colors = [
                      "#667eea",
                      "#764ba2",
                      "#f093fb",
                      "#4facfe",
                      "#43e97b",
                      "#fa709a",
                      "#fee140",
                      "#30cfd0",
                      "#a8edea",
                      "#ff9a9e",
                    ];
                    let currentAngle = -90;
                    const radius = 80;
                    const innerRadius = 50;
                    const centerX = 100;
                    const centerY = 100;

                    return categoryStats.map((stat, index) => {
                      const percentage = (stat.total / totalSpending) * 100;
                      const angle = (percentage / 100) * 360;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + angle;

                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;

                      const x1 = centerX + radius * Math.cos(startRad);
                      const y1 = centerY + radius * Math.sin(startRad);
                      const x2 = centerX + radius * Math.cos(endRad);
                      const y2 = centerY + radius * Math.sin(endRad);

                      const ix1 = centerX + innerRadius * Math.cos(startRad);
                      const iy1 = centerY + innerRadius * Math.sin(startRad);
                      const ix2 = centerX + innerRadius * Math.cos(endRad);
                      const iy2 = centerY + innerRadius * Math.sin(endRad);

                      const largeArc = angle > 180 ? 1 : 0;

                      const pathData = [
                        `M ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                        `L ${ix2} ${iy2}`,
                        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
                        "Z",
                      ].join(" ");

                      currentAngle = endAngle;

                      return (
                        <path
                          key={stat._id}
                          d={pathData}
                          fill={colors[index % colors.length]}
                          opacity="0.9"
                        />
                      );
                    });
                  })()}
                </svg>

                <div className="category-legend">
                  {categoryStats.map((stat, index) => {
                    const colors = [
                      "#667eea",
                      "#764ba2",
                      "#f093fb",
                      "#4facfe",
                      "#43e97b",
                      "#fa709a",
                      "#fee140",
                      "#30cfd0",
                      "#a8edea",
                      "#ff9a9e",
                    ];
                    const percentage = (stat.total / totalSpending) * 100;
                    return (
                      <div key={stat._id} className="legend-item">
                        <div
                          className="legend-color"
                          style={{
                            backgroundColor: colors[index % colors.length],
                          }}
                        ></div>
                        <div className="legend-details">
                          <div className="legend-name">
                            {stat._id.charAt(0).toUpperCase() +
                              stat._id.slice(1)}
                          </div>
                          <div className="legend-value">
                            {formatCurrency(stat.total)} (
                            {percentage.toFixed(0)}%)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <p>No spending data available</p>
                <button
                  onClick={() => navigate("/transactions")}
                  className="btn btn-secondary"
                >
                  Add Transaction
                </button>
              </div>
            )}
          </div>
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
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Transactions
          </h2>
          {transactions.length > 0 && (
            <button
              onClick={() => navigate("/transactions")}
              className="btn-text"
            >
              View all
            </button>
          )}
        </div>
        <div className="card-content">
          {transactions.length > 0 ? (
            <div className="transaction-list">
              {transactions.slice(0, 8).map((transaction) => (
                <div key={transaction._id} className="transaction-item">
                  <div className="transaction-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-description">
                      {transaction.description}
                    </div>
                    <div className="transaction-meta">
                      <span className="transaction-category">
                        {transaction.category}
                      </span>
                      <span className="transaction-date">
                        {formatDate(transaction.date)}
                      </span>
                    </div>
                  </div>
                  <div className="transaction-amount">
                    {formatCurrency(transaction.amount)}
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
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No transactions yet</p>
              <button
                onClick={() => navigate("/transactions")}
                className="btn btn-primary"
              >
                Add Transaction
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
