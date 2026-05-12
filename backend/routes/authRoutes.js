const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Missing fields' });

    let user = await User.findOne({ name: username.toLowerCase().trim() });
    
    if (!user) {
      // Auto-create initial users if they don't exist
      const validInitialUsers = ['akash gupta', 'amit', 'nitin', 'ritik', 'aquro'];
      const normalizedUsername = username.toLowerCase().trim();
      
      if (validInitialUsers.includes(normalizedUsername)) {
        const defaultRole = (normalizedUsername === 'akash gupta' || normalizedUsername === 'aquro') ? 'admin' : 'viewer';
        const defaultPass = normalizedUsername === 'aquro' ? '1234' : `${normalizedUsername.replace(' ', '')}123`;
        
        if (password === defaultPass) {
          user = new User({
             name: normalizedUsername,
             email: `${normalizedUsername.replace(' ', '')}@aquro.local`,
             password: defaultPass,
             role: defaultRole
          });
          await user.save();
          return res.json({ success: true, role: defaultRole, username: normalizedUsername });
        }
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      res.json({ success: true, role: user.role, username: user.name });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    const user = await User.findOne({ name: username.toLowerCase().trim() });
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect old password' });

    user.password = newPassword;
    await user.save(); // pre-save will hash the new password
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
