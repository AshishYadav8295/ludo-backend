const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        default: 'Ludo Player'
    },
    depositWallet: {
        type: Number,
        default: 100 // Welcome Bonus
    },
    winningWallet: {
        type: Number,
        default: 0
    },
    bonusWallet: {
        type: Number,
        default: 0
    },
    referralCode: {
        type: String,
        default: null // <--- Yahan unique: true hata kar default: null kar diya
    },
    referredBy: {
        type: String,
        default: null
    },
    isBlock: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.virtual('balance').get(function() {
    return (this.depositWallet || 0) + (this.winningWallet || 0) + (this.bonusWallet || 0);
});

module.exports = mongoose.model('User', userSchema);