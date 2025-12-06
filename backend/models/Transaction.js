const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: [
      "food",
      "rent",
      "transport",
      "shopping",
      "subscriptions",
      "entertainment",
      "utilities",
      "healthcare",
      "others",
    ],
    default: "others",
  },
  type: {
    type: String,
    enum: ["expense", "income"],
    default: "expense",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient querying
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
