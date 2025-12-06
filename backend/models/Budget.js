const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  month: {
    type: String, // Format: "YYYY-MM"
    required: true,
  },
  totalBudget: {
    type: Number,
    required: true,
    min: 0,
  },
  categoryBudgets: {
    food: { type: Number, default: 0 },
    rent: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    shopping: { type: Number, default: 0 },
    subscriptions: { type: Number, default: 0 },
    entertainment: { type: Number, default: 0 },
    utilities: { type: Number, default: 0 },
    healthcare: { type: Number, default: 0 },
    others: { type: Number, default: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient querying
budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

budgetSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Budget", budgetSchema);
