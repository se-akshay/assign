const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Transaction = require("../models/Transaction");
const Analysis = require("../models/Analysis");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Generate AI analysis
router.post("/generate", auth, async (req, res) => {
  try {
    // Default to current month if not provided
    const month = req.body.month || new Date().toISOString().slice(0, 7);

    // Get transactions for the month
    const [year, monthNum] = month.split("-");
    const startOfMonth = new Date(year, monthNum - 1, 1);
    const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      userId: new mongoose.Types.ObjectId(req.userId),
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ date: -1 });

    if (transactions.length === 0) {
      return res
        .status(400)
        .json({ error: "No transactions found for this month" });
    }

    // Calculate category totals
    const categoryTotals = {};
    let totalSpending = 0;

    transactions.forEach((transaction) => {
      totalSpending += transaction.amount;
      categoryTotals[transaction.category] =
        (categoryTotals[transaction.category] || 0) + transaction.amount;
    });

    // Sort categories by amount
    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpending) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Prepare data for AI
    const transactionSummary = transactions.slice(0, 20).map((t) => ({
      date: t.date.toISOString().split("T")[0],
      description: t.description,
      amount: t.amount,
      category: t.category,
    }));

    // Generate AI analysis
    let aiResponse;
    try {
      const prompt = `You are a helpful financial advisor. Analyze this spending data for ${month}:

Total Spending: $${totalSpending.toFixed(2)}
Number of Transactions: ${transactions.length}

Top Categories:
${topCategories
  .map(
    (c) =>
      `- ${c.category}: $${c.amount.toFixed(2)} (${c.percentage.toFixed(1)}%)`
  )
  .join("\n")}

Recent Transactions:
${transactionSummary
  .map((t) => `- ${t.date}: ${t.description} - $${t.amount.toFixed(2)}`)
  .join("\n")}

Please provide:
1. A brief spending pattern summary (2-3 sentences)
2. Identify areas to cut spending
3. Suggest a realistic monthly saving goal based on this spending
4. Give 2-3 specific actionable tips

Keep the response concise and practical.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      aiResponse = response.text();
    } catch (aiError) {
      console.error("Gemini API error:", aiError);

      // Fallback analysis if AI fails
      aiResponse = `Summary: You spent $${totalSpending.toFixed(
        2
      )} this month across ${
        transactions.length
      } transactions. Your top spending category is ${
        topCategories[0].category
      } at $${topCategories[0].amount.toFixed(2)}.

Areas to reduce: Consider reducing ${
        topCategories[0].category
      } spending, which accounts for ${topCategories[0].percentage.toFixed(
        1
      )}% of your total expenses.

Saving Goal: Try to save $${(totalSpending * 0.2).toFixed(
        2
      )} next month (20% of current spending).

Tips:
- Track daily expenses to stay aware of spending habits
- Set category-specific budgets for better control
- Review subscriptions and cancel unused services`;
    }

    // Parse suggestions from AI response
    const suggestions = aiResponse
      .split("\n")
      .filter((line) => line.trim().startsWith("-") || line.match(/^\d+\./))
      .map((line) => line.replace(/^[-\d.]\s*/, "").trim())
      .filter((line) => line.length > 0);

    // Calculate saving goal
    const savingGoal = Math.round(totalSpending * 0.2);

    // Save analysis
    const analysis = new Analysis({
      userId: req.userId,
      month,
      summary: aiResponse,
      topCategories: topCategories.slice(0, 5),
      suggestions,
      savingGoal,
      totalSpending,
    });

    await analysis.save();

    res.json({
      message: "Analysis generated successfully",
      analysis,
    });
  } catch (error) {
    console.error("Error generating analysis:", error);
    res.status(500).json({ error: "Error generating analysis" });
  }
});

// Get analysis for a month
router.get("/:month?", auth, async (req, res) => {
  try {
    // Default to current month if not provided
    const month = req.params.month || new Date().toISOString().slice(0, 7);

    const analysis = await Analysis.findOne({
      userId: new mongoose.Types.ObjectId(req.userId),
      month,
    }).sort({ createdAt: -1 });

    if (!analysis) {
      return res
        .status(404)
        .json({ error: "No analysis found for this month" });
    }

    res.json(analysis);
  } catch (error) {
    console.error("Error fetching analysis:", error);
    res.status(500).json({ error: "Error fetching analysis" });
  }
});

// Get all analyses (history)
router.get("/", auth, async (req, res) => {
  try {
    const analyses = await Analysis.find({
      userId: new mongoose.Types.ObjectId(req.userId),
    })
      .sort({ month: -1 })
      .limit(12);

    res.json(analyses);
  } catch (error) {
    console.error("Error fetching analyses:", error);
    res.status(500).json({ error: "Error fetching analyses" });
  }
});

module.exports = router;
