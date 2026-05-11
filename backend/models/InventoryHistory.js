const mongoose = require('mongoose');

const inventoryHistorySchema = new mongoose.Schema({
  date: { type: String, required: true },
  itemName: { type: String, required: true },
  previousStock: { type: Number, required: true },
  addedQty: { type: Number, required: true },
  newStock: { type: Number, required: true },
  supplier: { type: String },
  notes: { type: String },
  amount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('InventoryHistory', inventoryHistorySchema);
