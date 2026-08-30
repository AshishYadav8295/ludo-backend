const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creatorPhone: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 10
    },
    status: {
        type: String,
        enum: ['open', 'running', 'review', 'completed', 'cancelled'],
        default: 'open'
    },
    resultStatus: {
        type: String,
        default: 'PENDING'
    },
    screenshot: {
        type: String,
        default: ""
    },
    roomCode: {
        type: String,
        default: null
    },
    joinedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    accepterPhone: {
        type: String,
        default: ""
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);