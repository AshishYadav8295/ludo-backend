const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Login / Register Route
router.post('/login', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone || phone.length !== 10) {
            return res.status(400).json({ success: false, message: 'Kripya 10-digit phone number enter karein.' });
        }

        let user = await User.findOne({ phone });
        if (!user) {
            user = await User.create({
                phone,
                depositWallet: 100,
                winningWallet: 0,
                bonusWallet: 0
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login Successful',
            token,
            user: {
                _id: user._id,
                phone: user.phone,
                depositWallet: user.depositWallet,
                winningWallet: user.winningWallet,
                bonusWallet: user.bonusWallet,
                role: user.role,
                balance: user.balance
            }
        });
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(500).json({ success: false, message: 'Server error! Login nahi ho paya.' });
    }
});

module.exports = router;