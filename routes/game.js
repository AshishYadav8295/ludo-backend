const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');

// 1. Get Open Battles
router.get('/open-battles', async (req, res) => {
    try {
        const battles = await Game.find({ status: 'open' }).sort({ createdAt: -1 });
        res.json({ success: true, battles });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// 2. Create Battle
router.post('/create-battle', async (req, res) => {
    try {
        const { amount, userId } = req.body;
        const numAmount = Number(amount);

        if (!numAmount || numAmount < 10) {
            return res.status(400).json({ success: false, message: 'Minimum battle amount is ₹10' });
        }

        const user = await User.findOneAndUpdate(
            { _id: userId, depositWallet: { $gte: numAmount } },
            { $inc: { depositWallet: -numAmount } },
            { new: true }
        );

        if (!user) {
            return res.status(400).json({ success: false, message: 'Insufficient balance or User invalid!' });
        }

        const newGame = new Game({
            createdBy: user._id,
            creatorPhone: user.phone,
            amount: numAmount,
            prize: numAmount * 1.8,
            status: 'open'
        });

        await newGame.save();

        res.json({
            success: true,
            game: newGame,
            updatedBalance: (user.depositWallet || 0) + (user.winningWallet || 0) + (user.bonusWallet || 0)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating battle' });
    }
});

// 3. Join Battle
router.post('/join-battle', async (req, res) => {
    try {
        const { gameId, userId } = req.body;
        const game = await Game.findById(gameId);

        if (!game || game.status !== 'open') {
            return res.status(400).json({ success: false, message: 'Battle active nahi hai.' });
        }

        if (game.createdBy.toString() === userId) {
            return res.status(400).json({ success: false, message: 'Apni hi battle join nahi kar sakte!' });
        }

        const user = await User.findOneAndUpdate(
            { _id: userId, depositWallet: { $gte: game.amount } },
            { $inc: { depositWallet: -game.amount } },
            { new: true }
        );

        if (!user) {
            return res.status(400).json({ success: false, message: 'Insufficient balance to join!' });
        }

        game.joinedBy = user._id;
        game.accepterPhone = user.phone;
        game.status = 'running';
        await game.save();

        res.json({
            success: true,
            game,
            updatedBalance: (user.depositWallet || 0) + (user.winningWallet || 0) + (user.bonusWallet || 0)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error joining battle' });
    }
});

// 4. Update Room Code
router.post('/update-roomcode', async (req, res) => {
    try {
        const { gameId, roomCode } = req.body;
        const game = await Game.findByIdAndUpdate(gameId, { roomCode }, { new: true });
        res.json({ success: true, game });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating room code' });
    }
});

// 5. Submit Game Result (Base64 Large Upload Allowed)
router.post('/submit-result', async (req, res) => {
    try {
        const { gameId, status, screenshot } = req.body;
        const updatedGame = await Game.findByIdAndUpdate(
            gameId,
            { status: 'review', resultStatus: status.toUpperCase(), screenshot: screenshot || '' },
            { new: true }
        );

        res.json({ success: true, message: 'Result submitted for Admin Review!', game: updatedGame });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error submitting result' });
    }
});

// 6. Admin: Pending Reviews Fetch
router.get('/pending-reviews', async (req, res) => {
    try {
        const games = await Game.find({ status: 'review' })
            .populate('createdBy', 'phone')
            .populate('joinedBy', 'phone')
            .sort({ updatedAt: -1 });

        res.json({ success: true, reviews: games });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching reviews' });
    }
});

module.exports = router;