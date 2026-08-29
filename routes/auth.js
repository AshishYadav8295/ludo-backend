const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Code-based Auto Index Drop (Index apne aap delete ho jayega)
User.collection.dropIndex('referralCode_1')
    .then(() => console.log('✅ Success: Bad referralCode index deleted successfully!'))
    .catch(err => console.log('ℹ️ Index check done.'));

// Login / Register Route
router.post('/login', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone || phone.length !== 10) {
            return res.status(400).json({ 
                success: false, 
                message: 'Kripya 10-digit phone number enter karein.' 
            });
        }

        let user = await User.findOne({ phone });

        if (!user) {
            user = await User.create({
                phone: phone,
                depositWallet: 100, // ₹100 Bonus
                winningWallet: 0,
                bonusWallet: 0
            });
        }

        res.json({
            success: true,
            message: 'Login Successful',
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Auth Login Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error! Login nahi ho paya.' 
        });
    }
});

module.exports = router;