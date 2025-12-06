const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  month: {
    type: String, // Format: "YYYY-MM"
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  topCategories: [
    {
      category: String,
      amount: Number,
      percentage: Number,
    },
  ],
  suggestions: [String],
  savingGoal: {
    type: Number,
    default: 0,
  },
  totalSpending: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient querying
analysisSchema.index({ userId: 1, month: -1 });

module.exports = mongoose.model("Analysis", analysisSchema);
