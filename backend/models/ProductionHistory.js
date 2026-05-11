const mongoose = require('mongoose');

const productionHistorySchema = new mongoose.Schema({
  timestamp: { type: String },
  type: { type: String },
  batch: { type: String },
  details: { type: String },
  payload: { type: mongoose.Schema.Types.Mixed },
  operator: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ProductionHistory', productionHistorySchema);
