const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const EmployeePayment = require('../models/EmployeePayment');

// Get all employees with their total paid amounts
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    
    // Aggregate payments for each employee
    const employeesWithStats = await Promise.all(employees.map(async (emp) => {
      const payments = await EmployeePayment.find({ employeeId: emp._id }).sort({ date: -1, createdAt: -1 });
      const totalCredit = payments.filter(p => p.type === 'Credit').reduce((sum, p) => sum + p.amount, 0);
      const totalDebit = payments.filter(p => p.type === 'Debit').reduce((sum, p) => sum + p.amount, 0);
      const balance = totalCredit - totalDebit; // Positive means plant owes employee, Negative means employee owes plant (advance)
      return {
        ...emp.toObject(),
        totalCredit,
        totalDebit,
        balance,
        payments
      };
    }));

    res.json(employeesWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new employee
router.post('/', async (req, res) => {
  try {
    const newEmployee = new Employee(req.body);
    const savedEmployee = await newEmployee.save();
    res.status(201).json(savedEmployee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEmployee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    await EmployeePayment.deleteMany({ employeeId: req.params.id });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add payment
router.post('/payment', async (req, res) => {
  try {
    const payment = new EmployeePayment(req.body);
    const savedPayment = await payment.save();
    res.status(201).json(savedPayment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete payment
router.delete('/payment/:id', async (req, res) => {
  try {
    await EmployeePayment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
