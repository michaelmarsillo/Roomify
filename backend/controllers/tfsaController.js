const TFSA = require('../models/TFSA');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// TFSA annual limits from 2009 to present
const TFSA_LIMITS = {
    2009: 5000,
    2010: 5000,
    2011: 5000,
    2012: 5000,
    2013: 5500,
    2014: 5500,
    2015: 10000,
    2016: 5500,
    2017: 5500,
    2018: 5500,
    2019: 6000,
    2020: 6000,
    2021: 6000,
    2022: 6000,
    2023: 6500,
    2024: 7000,
    2025: 7000
};

// Helper function to calculate withdrawals from previous years
// According to TFSA rules, withdrawals only get added back to contribution room
// on January 1st of the following year
const calculatePreviousYearWithdrawals = async (userId) => {
    const currentYear = new Date().getFullYear();
    const transactions = await Transaction.find({ 
        user: userId,
        type: 'withdrawal'
    });
    
    // Only sum withdrawals from years before the current year
    const previousYearWithdrawals = transactions
        .filter(t => new Date(t.date).getFullYear() < currentYear)
        .reduce((sum, t) => sum + t.amount, 0);
    
    return previousYearWithdrawals;
};

// Calculate initial contribution room
const calculateInitialContributionRoom = async (userId, yearTurned18) => {
    const currentYear = new Date().getFullYear();
    let totalRoom = 0;

    // Start from 2009 (when TFSA was introduced) or yearTurned18, whichever is later
    const startYear = Math.max(2009, yearTurned18);

    for (let year = startYear; year <= currentYear; year++) {
        if (TFSA_LIMITS[year]) {
            totalRoom += TFSA_LIMITS[year];
        }
    }

    // Create TFSA record for each year
    for (let year = startYear; year <= currentYear; year++) {
        if (TFSA_LIMITS[year]) {
            await TFSA.create({
                user: userId,
                year,
                contributionLimit: TFSA_LIMITS[year],
                availableRoom: TFSA_LIMITS[year]
            });
        }
    }
    
    // Save the fixed contribution room directly to the user
    const user = await User.findById(userId);
    if (user) {
        user.fixedContributionRoom = totalRoom;
        await user.save();
        console.log(`Set fixed contribution room for user ${userId} to ${totalRoom}`);
    }

    return totalRoom;
};

// Calculate current contribution room
const calculateContributionRoom = async (req, res) => {
    try {
        const userId = req.user._id;
        const currentYear = new Date().getFullYear();

        // Get all TFSA records for the user
        const tfsaRecords = await TFSA.find({ user: userId });
        
        // Get all transactions
        const transactions = await Transaction.find({ user: userId });

        // Calculate total room
        let totalRoom = 0;
        let usedRoom = 0;

        tfsaRecords.forEach(record => {
            totalRoom += record.contributionLimit;
            usedRoom += record.usedRoom;
        });

        // Calculate withdrawals from previous year
        const lastYearWithdrawals = transactions
            .filter(t => t.type === 'withdrawal' && 
                        new Date(t.date).getFullYear() === currentYear - 1)
            .reduce((sum, t) => sum + t.amount, 0);

        const availableRoom = totalRoom - usedRoom + lastYearWithdrawals;

        res.json({
            totalRoom,
            usedRoom,
            availableRoom,
            lastYearWithdrawals
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update transactions
const updateTransactions = async (req, res) => {
    try {
        const { type, amount, description, date } = req.body;
        const userId = req.user._id;
        
        // Validate transaction type
        if (type !== 'deposit' && type !== 'withdrawal') {
            return res.status(400).json({ 
                message: 'Transaction type must be deposit or withdrawal',
                receivedType: type
            });
        }
        
        // Validate amount
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Transaction amount must be greater than 0' });
        }

        // Create transaction with optional custom date
        const transactionData = {
            user: userId,
            type,
            amount,
            description
        };
        
        // If a custom date is provided, use it; otherwise use default (Date.now)
        if (date) {
            transactionData.date = new Date(date);
        }
        
        const transaction = await Transaction.create(transactionData);

        // Update user totals
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update deposit or withdrawal totals
        if (type === 'deposit') {
            // Initialize if undefined
            if (typeof user.totalDeposits !== 'number') user.totalDeposits = 0;
            user.totalDeposits += amount;
        } else {
            // Initialize if undefined
            if (typeof user.totalWithdrawals !== 'number') user.totalWithdrawals = 0;
            user.totalWithdrawals += amount;
        }
        
        await user.save();
        
        // Get the FIXED contribution room from the user model - this NEVER changes
        const totalContributionRoom = user.fixedContributionRoom; 
        
        // If it's not set yet for some reason, calculate it once
        if (!totalContributionRoom || totalContributionRoom === 0) {
            console.log(`Fixed contribution room not set for user ${userId}, calculating it now.`);
            const tfsaRecords = await TFSA.find({ user: userId });
            const calculatedRoom = tfsaRecords.reduce(
                (sum, record) => sum + record.contributionLimit, 
                0
            );
            
            // Save this fixed value to the user
            user.fixedContributionRoom = calculatedRoom;
            await user.save();
            
            console.log(`Set missing contribution room for user ${userId} to ${calculatedRoom}`);
        }
        
        // Calculate remaining room after this transaction
        // Only withdrawals from previous years count toward available room
        const previousYearWithdrawals = await calculatePreviousYearWithdrawals(userId);
        const remainingRoom = user.fixedContributionRoom - user.totalDeposits + previousYearWithdrawals;
        
        // Return the transaction with updated room information
        res.status(201).json({
            transaction: {
                id: transaction._id,
                type,
                amount,
                date: transaction.date,
                userId
            },
            // Total contribution room from the user model - NEVER changes
            contributionRoom: user.fixedContributionRoom, 
            totalDeposits: user.totalDeposits,
            totalWithdrawals: user.totalWithdrawals,
            remainingRoom: remainingRoom // This DOES change with transactions
        });
    } catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Add a deleteTransaction function
const deleteTransaction = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const userId = req.user._id;
        
        // Find the transaction to be deleted
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        
        // Check if the transaction belongs to the user
        if (transaction.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this transaction' });
        }
        
        // Get the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update user totals based on transaction type
        if (transaction.type && transaction.type.toString() === 'deposit') {
            user.totalDeposits -= transaction.amount;
            if (user.totalDeposits < 0) user.totalDeposits = 0;
        } else if (transaction.type && transaction.type.toString() === 'withdrawal') {
            user.totalWithdrawals -= transaction.amount;
            if (user.totalWithdrawals < 0) user.totalWithdrawals = 0;
        }
        
        // Save the updated user
        await user.save();
        
        // Delete the transaction
        await Transaction.findByIdAndDelete(transactionId);
        
        // Calculate the remaining room after deletion
        // Only withdrawals from previous years count toward available room
        const previousYearWithdrawals = await calculatePreviousYearWithdrawals(userId);
        const remainingRoom = user.fixedContributionRoom - user.totalDeposits + previousYearWithdrawals;
        
        res.json({
            success: true,
            message: 'Transaction deleted successfully',
            deletedTransaction: {
                id: transaction._id,
                type: transaction.type,
                amount: transaction.amount,
                date: transaction.date
            },
            contributionRoom: user.fixedContributionRoom, // FIXED AMOUNT
            totalDeposits: user.totalDeposits,
            totalWithdrawals: user.totalWithdrawals,
            remainingRoom: remainingRoom // This changes with transactions
        });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    calculateInitialContributionRoom,
    calculateContributionRoom,
    updateTransactions,
    deleteTransaction,
    calculatePreviousYearWithdrawals,
    TFSA_LIMITS
};