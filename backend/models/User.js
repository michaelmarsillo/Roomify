const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    yearTurned18: {
        type: Number,
        required: [true, 'Year turned 18 is required'],
        max: [new Date().getFullYear(), 'Year cannot be in the future']
    },
    fixedContributionRoom: {
        type: Number,
        default: 0,
        min: [0, 'Contribution room cannot be negative']
    },
    totalDeposits: {
        type: Number,
        default: 0,
        min: [0, 'Total deposits cannot be negative']
    },
    totalWithdrawals: {
        type: Number,
        default: 0,
        min: [0, 'Total withdrawals cannot be negative']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords - removed logging of passwords
UserSchema.methods.matchPassword = async function(enteredPassword) {
    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

const User = mongoose.model('User', UserSchema);
module.exports = User;