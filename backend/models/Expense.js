const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  date: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMode: { type: String, default: 'Cash' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
