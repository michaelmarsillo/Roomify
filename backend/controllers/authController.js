const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { calculateInitialContributionRoom } = require('./tfsaController');

// Register user
const registerUser = async (req, res) => {
    try {
        console.log('Registration attempt:', req.body);
        const { email, password, yearTurned18 } = req.body;

        // Validate input
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }
        if (!yearTurned18) {
            return res.status(400).json({ message: 'Year turned 18 is required' });
        }

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        user = new User({
            email,
            password,
            yearTurned18
        });

        await user.save();
        console.log('User created successfully:', { id: user._id, email });

        try {
            // Calculate initial contribution room
            const room = await calculateInitialContributionRoom(user._id, yearTurned18);
            console.log('Initial contribution room calculated:', room);
        } catch (roomError) {
            console.error('Error calculating initial contribution room:', roomError);
            // Continue despite error - the room can be calculated later
        }

        // Create token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        console.log('Registration successful for:', email);
        return res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                yearTurned18: user.yearTurned18
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
};

// Login user
const loginUser = async (req, res) => {
    try {
        console.log('Login attempt:', { email: req.body.email });
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        console.log('Login successful for:', email);
        return res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                yearTurned18: user.yearTurned18
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

module.exports = {
    registerUser,
    loginUser
};