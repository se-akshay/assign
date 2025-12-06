const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Transaction = require("../models/Transaction");
const os = require("os");

// Configure multer for file uploads - use /tmp for Vercel
const upload = multer({ dest: path.join(os.tmpdir(), "uploads") });

// Helper function to categorize transactions based on keywords
const categorizeTransaction = (description) => {
  const desc = description.toLowerCase();

  const categories = {
    food: [
      "restaurant",
      "cafe",
      "grocery",
      "food",
      "pizza",
      "burger",
      "coffee",
      "starbucks",
      "mcdonald",
      "delivery",
      "uber eats",
      "doordash",
    ],
    rent: ["rent", "lease", "landlord", "housing", "apartment"],
    transport: [
      "uber",
      "lyft",
      "taxi",
      "gas",
      "fuel",
      "parking",
      "metro",
      "transit",
      "train",
      "bus",
    ],
    shopping: [
      "amazon",
      "walmart",
      "target",
      "mall",
      "store",
      "shop",
      "clothing",
      "fashion",
    ],
    subscriptions: [
      "netflix",
      "spotify",
      "subscription",
      "monthly",
      "prime",
      "hulu",
      "disney",
    ],
    entertainment: [
      "movie",
      "cinema",
      "concert",
      "game",
      "entertainment",
      "ticket",
      "theater",
    ],
    utilities: [
      "electric",
      "water",
      "internet",
      "phone",
      "utility",
      "bill",
      "cable",
    ],
    healthcare: [
      "pharmacy",
      "doctor",
      "hospital",
      "medical",
      "health",
      "clinic",
      "medicine",
    ],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => desc.includes(keyword))) {
      return category;
    }
  }

  return "others";
};

// Test route - no auth required
router.get("/test", async (req, res) => {
  try {
    res.json({
      message: "Transaction route is working",
      mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all transactions
router.get("/", auth, async (req, res) => {
  try {
    const { startDate, endDate, category, month } = req.query;

    let query = { userId: new mongoose.Types.ObjectId(req.userId) };

    // Date filtering
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (month) {
      // Filter by specific month (format: YYYY-MM)
      const [year, monthNum] = month.split("-");
      const startOfMonth = new Date(year, monthNum - 1, 1);
      const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59);
      query.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    // Category filtering
    if (category && category !== "all") {
      query.category = category;
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(1000);

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Error fetching transactions" });
  }
});

// Get transaction statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const { month } = req.query;

    let dateQuery = {};
    if (month) {
      const [year, monthNum] = month.split("-");
      const startOfMonth = new Date(year, monthNum - 1, 1);
      const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59);
      dateQuery = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const stats = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId),
          ...(month && { date: dateQuery }),
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    const totalSpending = stats.reduce((sum, stat) => sum + stat.total, 0);

    res.json({
      stats,
      totalSpending,
      transactionCount: stats.reduce((sum, stat) => sum + stat.count, 0),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Error fetching statistics" });
  }
});

// Add manual transaction
router.post("/manual", auth, async (req, res) => {
  try {
    const { date, description, amount, category } = req.body;

    console.log("Request body:", req.body);
    console.log("User ID from token:", req.userId);

    if (!date || !description || !amount) {
      return res
        .status(400)
        .json({ error: "Please provide all required fields" });
    }

    const transaction = new Transaction({
      userId: new mongoose.Types.ObjectId(req.userId),
      date: new Date(date),
      description,
      amount: parseFloat(amount),
      category: category || categorizeTransaction(description),
      type: amount < 0 ? "income" : "expense",
    });

    console.log("Transaction to save:", transaction);
    await transaction.save();

    res.status(201).json({
      message: "Transaction added successfully",
      transaction,
    });
  } catch (error) {
    console.error("Error adding transaction:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ 
      error: "Error adding transaction",
      details: error.message 
    });
  }
});

// Upload CSV file
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a CSV file" });
    }

    const transactions = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        // Expected CSV format: date, description, amount
        // Handle various CSV formats
        const date = row.date || row.Date || row.DATE;
        const description =
          row.description || row.Description || row.DESCRIPTION;
        const amount = row.amount || row.Amount || row.AMOUNT;

        if (date && description && amount) {
          transactions.push({
            userId: new mongoose.Types.ObjectId(req.userId),
            date: new Date(date),
            description: description.trim(),
            amount: Math.abs(parseFloat(amount)),
            category: categorizeTransaction(description),
            type: "expense",
          });
        }
      })
      .on("end", async () => {
        try {
          if (transactions.length > 0) {
            await Transaction.insertMany(transactions);
          }

          // Delete uploaded file
          fs.unlinkSync(filePath);

          res.json({
            message: "CSV uploaded successfully",
            count: transactions.length,
          });
        } catch (error) {
          console.error("Error saving transactions:", error);
          fs.unlinkSync(filePath);
          res.status(500).json({ error: "Error saving transactions" });
        }
      })
      .on("error", (error) => {
        console.error("Error parsing CSV:", error);
        fs.unlinkSync(filePath);
        res.status(500).json({ error: "Error parsing CSV file" });
      });
  } catch (error) {
    console.error("Error uploading file:", error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Error uploading file" });
  }
});

// Delete transaction
router.delete("/:id", auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.userId),
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ error: "Error deleting transaction" });
  }
});

module.exports = router;
