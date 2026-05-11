const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  date: { type: String },
  amount: { type: Number },
  type: { type: String, default: 'PAYMENT' },
  note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CustomerPayment', paymentSchema);
