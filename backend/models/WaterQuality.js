const mongoose = require('mongoose');

const waterQualitySchema = new mongoose.Schema({
  date: { type: String, required: true },
  sampleId: { type: String, required: true },
  source: { type: String },
  testedBy: { type: String },
  ph: { type: String },
  tds: { type: String },
  turbidity: { type: String },
  hardness: { type: String },
  chloride: { type: String },
  nitrate: { type: String },
  iron: { type: String },
  fluoride: { type: String },
  alkalinity: { type: String },
  coliform: { type: String },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('WaterQuality', waterQualitySchema);
