const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accepter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    amount: {
        type: Number,
        required: true
    },
    prize: {
        type: Number,
        required: true
    },
    roomCode: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['open', 'accepted', 'running', 'completed', 'cancelled', 'dispute'],
        default: 'open'
    },
    creatorProof: {
        type: String,
        default: ''
    },
    accepterProof: {
        type: String,
        default: ''
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Challenge', challengeSchema);