const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const InventoryHistory = require('../models/InventoryHistory');

// GET all inventory items
router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET inventory history
router.get('/history', async (req, res) => {
  try {
    const history = await InventoryHistory.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new inventory item
router.post('/', async (req, res) => {
  const item = new Inventory(req.body);
  try {
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST new history entry
router.post('/history', async (req, res) => {
  const entry = new InventoryHistory(req.body);
  try {
    const newEntry = await entry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update inventory item
router.put('/:id', async (req, res) => {
  try {
    const updated = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update history entry
router.put('/history/:id', async (req, res) => {
  try {
    const updated = await InventoryHistory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE inventory item
router.delete('/:id', async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inventory item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE history entry
router.delete('/history/:id', async (req, res) => {
  try {
    await InventoryHistory.findByIdAndDelete(req.params.id);
    res.json({ message: 'History entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
