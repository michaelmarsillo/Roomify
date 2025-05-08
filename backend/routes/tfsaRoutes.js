const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/authenticateUser');
const { calculateInitialContributionRoom, calculateContributionRoom, updateTransactions, deleteTransaction } = require('../controllers/tfsaController');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const TFSA = require('../models/TFSA');

// Debug endpoint to check transaction types
router.get('/debug/transactions', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const transactions = await Transaction.find({ user: userId });
    
    // Log all transaction types for debugging
    console.log('Transaction types:');
    transactions.forEach(t => {
      console.log(`ID: ${t._id}, Type: ${t.type}, Amount: ${t.amount}`);
    });
    
    res.json({
      count: transactions.length,
      transactionTypes: transactions.map(t => ({ 
        id: t._id, 
        type: t.type, 
        amount: t.amount,
        rawType: typeof t.type
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Debug error', error: error.message });
  }
});

// Root endpoint for TFSA data
router.get('/', authenticateUser, async (req, res) => {
  try {
    // Basic error checking
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const userId = req.user._id;
    
    // Get user data with error handling
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get transactions with error handling
    let transactions = [];
    try {
      transactions = await Transaction.find({ user: userId }).sort({ date: -1 });
    } catch (transactionError) {
      console.error('Error fetching transactions:', transactionError);
      // Continue with empty transactions array
    }
    
    // Get the FIXED contribution room from the user model
    let totalContributionRoom = user.fixedContributionRoom || 0;
    
    // Initialize totals if they don't exist
    if (typeof user.totalDeposits !== 'number') user.totalDeposits = 0;
    if (typeof user.totalWithdrawals !== 'number') user.totalWithdrawals = 0;
    
    let totalDeposits = user.totalDeposits;
    let totalWithdrawals = user.totalWithdrawals;
    
    // If the fixedContributionRoom hasn't been set yet, calculate it and store it
    if (totalContributionRoom === 0) {
      try {
        // Calculate and store the fixed total contribution room based on year turned 18
        const tfsaRecords = await TFSA.find({ user: userId });
        
        if (tfsaRecords.length === 0) {
          // First time - initialize the contribution room
          totalContributionRoom = await calculateInitialContributionRoom(userId, user.yearTurned18);
          
          // Refresh user to get updated fixedContributionRoom
          const updatedUser = await User.findById(userId);
          if (updatedUser) {
            totalContributionRoom = updatedUser.fixedContributionRoom;
          }
        } else {
          // Sum up contribution limits - this should happen only once per user
          totalContributionRoom = tfsaRecords.reduce((sum, record) => sum + record.contributionLimit, 0);
          
          // Save this fixed value to the user model so it never changes
          user.fixedContributionRoom = totalContributionRoom;
          await user.save();
          console.log(`Updated fixed contribution room for existing user ${userId} to ${totalContributionRoom}`);
        }
      } catch (error) {
        console.error('Error calculating contribution room:', error);
        totalContributionRoom = 6000; // Safe default
      }
    }
    
    // Calculate the VARIABLE remaining room
    const remainingRoom = totalContributionRoom - totalDeposits + totalWithdrawals;
    
    // Log the values for debugging
    console.log('TFSA Data:', {
      userId,
      fixedContributionRoom: totalContributionRoom,
      totalDeposits,
      totalWithdrawals,
      remainingRoom
    });
    
    // Return TFSA data with the fixed contribution room
    return res.json({
      contributionRoom: totalContributionRoom, // FIXED amount from user model - NEVER changes
      totalDeposits: totalDeposits,
      totalWithdrawals: totalWithdrawals,
      remainingRoom: remainingRoom, // This changes with transactions
      transactions: transactions.map(t => ({
        id: t._id,
        type: t.type === 'deposit' ? 'Deposit' : 'Withdrawal',
        amount: t.amount || 0,
        date: t.date || new Date(),
        userId: userId
      }))
    });
  } catch (error) {
    console.error('Error fetching TFSA data:', error);
    return res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Add a maintenance endpoint to fix contribution calculations
router.post('/fix-room', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all transactions
    const transactions = await Transaction.find({ user: userId });
    
    // Recalculate deposit and withdrawal totals
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === 'deposit') {
        totalDeposits += transaction.amount;
      } else if (transaction.type === 'withdrawal') {
        totalWithdrawals += transaction.amount;
      }
    });
    
    // Update user with new totals
    user.totalDeposits = totalDeposits;
    user.totalWithdrawals = totalWithdrawals;
    
    // Get or recalculate fixed contribution room
    let fixedContributionRoom = user.fixedContributionRoom;
    if (!fixedContributionRoom || fixedContributionRoom === 0) {
      // Recalculate fixed contribution room
      const tfsaRecords = await TFSA.find({ user: userId });
      
      if (tfsaRecords.length === 0) {
        // No TFSA records, calculate from year turned 18
        fixedContributionRoom = await calculateInitialContributionRoom(userId, user.yearTurned18);
      } else {
        // Sum up existing records
        fixedContributionRoom = tfsaRecords.reduce((sum, record) => sum + record.contributionLimit, 0);
      }
      
      // Save the recalculated fixed contribution room
      user.fixedContributionRoom = fixedContributionRoom;
    }
    
    // Save updated user
    await user.save();
    
    // Calculate remaining room
    const remainingRoom = fixedContributionRoom - totalDeposits + totalWithdrawals;
    
    return res.json({
      success: true,
      message: 'TFSA contribution data fixed',
      fixedContributionRoom: user.fixedContributionRoom,
      totalDeposits: user.totalDeposits,
      totalWithdrawals: user.totalWithdrawals,
      remainingRoom: remainingRoom
    });
  } catch (error) {
    console.error('Error fixing TFSA room:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Add route to delete a transaction
router.delete('/transactions/:transactionId', authenticateUser, deleteTransaction);

router.get('/calculate', authenticateUser, calculateContributionRoom);
router.post('/transactions', authenticateUser, updateTransactions);
router.get('/transactions', authenticateUser, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;