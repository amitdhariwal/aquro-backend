const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  category: { type: String, required: true },
  contactPerson: { type: String, required: true },
  mobile: { type: String, required: true },
  gstNumber: { type: String },
  address: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
