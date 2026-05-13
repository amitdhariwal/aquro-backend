const mongoose = require('mongoose');

const employeePaymentSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Credit', 'Debit'], default: 'Debit' }, // Credit = Plant owes employee (salary due, or employee gave money), Debit = Employee took money (salary paid, advance)
  paymentMode: { type: String, default: 'Cash' },
  month: { type: String }, // For which month
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('EmployeePayment', employeePaymentSchema);
