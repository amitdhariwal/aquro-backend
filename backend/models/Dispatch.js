const mongoose = require('mongoose');

const dispatchSchema = new mongoose.Schema({
  date: { type: String },
  challan: { type: String, required: true },
  customer: { type: String, required: true },
  size: { type: String, required: true },
  boxes: { type: Number, required: true },
  rate: { type: Number, required: true },
  qty: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  vehicle: { type: String },
  driver: { type: String },
  status: { type: String, default: 'In Transit' },
  isSample: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Dispatch', dispatchSchema);
