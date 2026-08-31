const express = require('express');
const router = express.Router();
const User = require('../models/User');

// User Login / Registration Route
router.post('/login', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone || phone.trim().length < 10) {
            return res.status(400).json({ 
                success: false, 
                message: 'Kripya sahi 10-digit mobile number darj karein.' 
            });
        }

        const cleanPhone = phone.trim();

        // Check if user exists or create new one
        let user = await User.findOne({ phone: cleanPhone });

        if (!user) {
            user = new User({
                phone: cleanPhone,
                name: 'Player_' + cleanPhone.slice(-4),
                depositWallet: 100, // Welcome Bonus
                winningWallet: 0,
                bonusWallet: 0,
                role: 'user'
            });
            await user.save();
        }

        const totalBalance = (user.depositWallet || 0) + (user.winningWallet || 0) + (user.bonusWallet || 0);

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            user: {
                _id: user._id,
                phone: user.phone,
                name: user.name,
                depositWallet: user.depositWallet,
                winningWallet: user.winningWallet,
                bonusWallet: user.bonusWallet,
                balance: totalBalance,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Auth Login Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Login Error: ' + error.message 
        });
    }
});

// Fetch User Profile Data
router.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const totalBalance = (user.depositWallet || 0) + (user.winningWallet || 0) + (user.bonusWallet || 0);

        res.json({
            success: true,
            user: {
                _id: user._id,
                phone: user.phone,
                name: user.name,
                depositWallet: user.depositWallet,
                winningWallet: user.winningWallet,
                bonusWallet: user.bonusWallet,
                balance: totalBalance,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching user profile' });
    }
});

module.exports = router;