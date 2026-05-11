const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// GET all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new customer
router.post('/', async (req, res) => {
  const customer = new Customer({
    businessName: req.body.businessName,
    category: req.body.category,
    ownerName: req.body.ownerName,
    mobile: req.body.mobile,
    state: req.body.state,
    district: req.body.district,
    block: req.body.block,
    address: req.body.address,
    image: req.body.image
  });

  try {
    const newCustomer = await customer.save();
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    customer.businessName = req.body.businessName || customer.businessName;
    customer.category = req.body.category || customer.category;
    customer.ownerName = req.body.ownerName || customer.ownerName;
    customer.mobile = req.body.mobile || customer.mobile;
    customer.state = req.body.state || customer.state;
    customer.district = req.body.district || customer.district;
    customer.block = req.body.block || customer.block;
    customer.address = req.body.address || customer.address;
    if (req.body.image !== undefined) customer.image = req.body.image;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    await customer.deleteOne();
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const CustomerPayment = require('../models/CustomerPayment');

// GET payments for a customer
router.get('/:id/payments', async (req, res) => {
  try {
    const payments = await CustomerPayment.find({ customerId: req.params.id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new payment for a customer
router.post('/:id/payments', async (req, res) => {
  const payment = new CustomerPayment({
    ...req.body,
    customerId: req.params.id
  });
  try {
    const newPayment = await payment.save();
    res.status(201).json(newPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
