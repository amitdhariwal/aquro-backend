const express = require('express');
const router = express.Router();
const Production = require('../models/Production');
const ProductionHistory = require('../models/ProductionHistory');

// GET all
router.get('/', async (req, res) => {
  try {
    const data = await Production.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET history
router.get('/history', async (req, res) => {
  try {
    const data = await ProductionHistory.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new
router.post('/', async (req, res) => {
  const item = new Production(req.body);
  try {
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST history
router.post('/history', async (req, res) => {
  const log = new ProductionHistory(req.body);
  try {
    const newLog = await log.save();
    res.status(201).json(newLog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const updated = await Production.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await Production.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
