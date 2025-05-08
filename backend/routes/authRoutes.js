const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const authenticateUser = require('../middleware/authenticateUser');
const TFSA = require('../models/TFSA');
const { TFSA_LIMITS } = require('../controllers/tfsaController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticateUser, (req, res) => {
  try {
    res.json({
      id: req.user._id,
      email: req.user.email,
      yearTurned18: req.user.yearTurned18,
      name: req.user.email ? req.user.email.split('@')[0] : 'User'
    });
  } catch (error) {
    console.error('Error in /me route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Special endpoint to fix contribution room for a user
router.post('/fix-contribution-room', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Calculate the fixed total contribution room based on year turned 18
    const currentYear = new Date().getFullYear();
    const startYear = Math.max(2009, user.yearTurned18);
    let totalRoom = 0;
    
    for (let year = startYear; year <= currentYear; year++) {
      if (TFSA_LIMITS[year]) {
        totalRoom += TFSA_LIMITS[year];
      }
    }
    
    // Save this fixed value to the user model
    user.fixedContributionRoom = totalRoom;
    await user.save();
    
    // Calculate remaining room
    const remainingRoom = totalRoom - user.totalDeposits + user.totalWithdrawals;
    
    return res.json({
      success: true,
      message: 'Contribution room fixed successfully',
      contributionRoom: totalRoom,
      remainingRoom: remainingRoom,
      totalDeposits: user.totalDeposits,
      totalWithdrawals: user.totalWithdrawals
    });
  } catch (error) {
    console.error('Error fixing contribution room:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error fixing contribution room',
      error: error.message
    });
  }
});

module.exports = router;