const mongoose = require('mongoose');

const TFSASchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    contributionLimit: {
        type: Number,
        required: true
    },
    usedRoom: {
        type: Number,
        default: 0
    },
    availableRoom: {
        type: Number,
        required: true
    }
});

const TFSA = mongoose.model('TFSA', TFSASchema);
module.exports = TFSA;
