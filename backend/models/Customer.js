const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  category: { type: String, default: 'Shop' },
  ownerName: { type: String, required: true },
  mobile: { type: String, required: true },
  state: { type: String, default: 'Uttar Pradesh' },
  district: { type: String, default: 'Amroha' },
  block: { type: String, required: true },
  address: { type: String, required: true },
  image: { type: String } // Base64 or URL
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
