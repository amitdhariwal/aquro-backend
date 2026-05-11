const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema({
  date: { type: String },
  batch: { type: String, required: true },
  expiry: { type: String },
  size: { type: String },
  capColor: { type: String },
  qty: { type: Number },
  label: { type: String },
  clientName: { type: String },
  operator: { type: String },
  status: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Production', productionSchema);
