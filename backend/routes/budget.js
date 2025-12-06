const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

// Get budget for a specific month
router.get("/:month", auth, async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM

    let budget = await Budget.findOne({
      userId: new mongoose.Types.ObjectId(req.userId),
      month,
    });

    if (!budget) {
      // Create default budget if not exists
      budget = new Budget({
        userId: new mongoose.Types.ObjectId(req.userId),
        month,
        totalBudget: 0,
        categoryBudgets: {},
      });
    }

    // Calculate current spending
    const [year, monthNum] = month.split("-");
    const startOfMonth = new Date(year, monthNum - 1, 1);
    const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      userId: new mongoose.Types.ObjectId(req.userId),
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const spending = {
      total: 0,
      byCategory: {
        food: 0,
        rent: 0,
        transport: 0,
        shopping: 0,
        subscriptions: 0,
        entertainment: 0,
        utilities: 0,
        healthcare: 0,
        others: 0,
      },
    };

    transactions.forEach((transaction) => {
      spending.total += transaction.amount;
      spending.byCategory[transaction.category] += transaction.amount;
    });

    // Calculate alerts
    const alerts = [];
    const totalPercentage =
      budget.totalBudget > 0 ? (spending.total / budget.totalBudget) * 100 : 0;

    if (totalPercentage >= 100) {
      alerts.push({
        type: "danger",
        message: "You have exceeded your total monthly budget!",
        category: "total",
      });
    } else if (totalPercentage >= 80) {
      alerts.push({
        type: "warning",
        message: `You have used ${totalPercentage.toFixed(
          0
        )}% of your monthly budget`,
        category: "total",
      });
    }

    // Check category budgets
    Object.keys(budget.categoryBudgets).forEach((category) => {
      const categoryBudget = budget.categoryBudgets[category];
      if (categoryBudget > 0) {
        const categorySpending = spending.byCategory[category];
        const percentage = (categorySpending / categoryBudget) * 100;

        if (percentage >= 100) {
          alerts.push({
            type: "danger",
            message: `${
              category.charAt(0).toUpperCase() + category.slice(1)
            } budget exceeded!`,
            category,
          });
        } else if (percentage >= 80) {
          alerts.push({
            type: "warning",
            message: `${
              category.charAt(0).toUpperCase() + category.slice(1)
            }: ${percentage.toFixed(0)}% used`,
            category,
          });
        }
      }
    });

    res.json({
      budget,
      spending,
      alerts,
      percentageUsed: totalPercentage,
    });
  } catch (error) {
    console.error("Error fetching budget:", error);
    res.status(500).json({ error: "Error fetching budget" });
  }
});

// Set or update budget
router.post("/", auth, async (req, res) => {
  try {
    const { month, totalBudget, categoryBudgets } = req.body;

    if (!month || totalBudget === undefined) {
      return res
        .status(400)
        .json({ error: "Month and total budget are required" });
    }

    let budget = await Budget.findOne({
      userId: new mongoose.Types.ObjectId(req.userId),
      month,
    });

    if (budget) {
      // Update existing budget
      budget.totalBudget = totalBudget;
      if (categoryBudgets) {
        budget.categoryBudgets = {
          ...budget.categoryBudgets,
          ...categoryBudgets,
        };
      }
      budget.updatedAt = Date.now();
    } else {
      // Create new budget
      budget = new Budget({
        userId: new mongoose.Types.ObjectId(req.userId),
        month,
        totalBudget,
        categoryBudgets: categoryBudgets || {},
      });
    }

    await budget.save();

    res.json({
      message: "Budget saved successfully",
      budget,
    });
  } catch (error) {
    console.error("Error saving budget:", error);
    res.status(500).json({ error: "Error saving budget" });
  }
});

module.exports = router;
