const mongoose = require('mongoose');

const waterQualitySchema = new mongoose.Schema({
  date:          { type: String, required: true },
  sampleId:      { type: String, required: true },
  batchNumber:   { type: String },          // Auto-filled from Production batch
  source:        { type: String },
  testedBy:      { type: String },
  // Physical / Chemical (from Excel: Aquro_Water_Parameters_Complete.xlsx)
  ph:            { type: String },          // BIS: 6.5–8.5
  tds:           { type: String },          // BIS: Max 500 mg/L
  turbidity:     { type: String },          // BIS: Max 1 NTU
  hardness:      { type: String },          // BIS: Max 200 mg/L
  calcium:       { type: String },          // BIS: Max 75 mg/L
  magnesium:     { type: String },          // BIS: Max 30 mg/L
  alkalinity:    { type: String },          // BIS: Max 200 mg/L
  chloride:      { type: String },          // BIS: Max 250 mg/L
  sulphate:      { type: String },          // BIS: Max 200 mg/L
  nitrate:       { type: String },          // BIS: Max 45 mg/L
  fluoride:      { type: String },          // BIS: Max 1.0 mg/L
  sodium:        { type: String },          // BIS: As per source
  potassium:     { type: String },          // BIS: As per source
  iron:          { type: String },          // BIS: Max 0.1 mg/L
  manganese:     { type: String },          // BIS: Max 0.05 mg/L
  copper:        { type: String },          // BIS: Max 0.05 mg/L
  zinc:          { type: String },          // BIS: Max 5 mg/L
  lead:          { type: String },          // BIS: Max 0.01 mg/L
  arsenic:       { type: String },          // BIS: Max 0.01 mg/L
  cadmium:       { type: String },          // BIS: Max 0.003 mg/L
  chromium:      { type: String },          // BIS: Max 0.05 mg/L
  mercury:       { type: String },          // BIS: Max 0.001 mg/L
  residualOzone: { type: String },          // BIS: 0.1–0.4 mg/L
  // Microbiological
  coliform:      { type: String },          // BIS: Absent/250 mL
  ecoli:         { type: String },          // BIS: Absent/250 mL
  pseudomonas:   { type: String },          // BIS: Absent/250 mL
  salmonella:    { type: String },          // BIS: Absent
  tpc:           { type: String },          // BIS: Very Low (<10 CFU/mL)
  remarks:       { type: String }
}, { timestamps: true });

module.exports = mongoose.model('WaterQuality', waterQualitySchema);
