const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  customId: { type: String, unique: true },
  name: { type: String, required: true },
  current: { type: Number, required: true, default: 0 },
  minimum: { type: Number, required: true, default: 500 },
  unit: { type: String, required: true, default: 'pcs' },
  isHidden: { type: Boolean, default: false },
  isCustomLabel: { type: Boolean, default: false },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String },
  labelSize: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
