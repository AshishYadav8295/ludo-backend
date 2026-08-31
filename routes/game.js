const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');

// 1. Get all open battles
router.get('/open-battles', async (req, res) => {
    try {
        const battles = await Game.find({ status: 'open' }).sort({ createdAt: -1 });
        res.json({ success: true, battles });
    } catch (error) {
        console.error('Error fetching battles:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 2. Create Battle (Safely deducts balance using Atomic Operations)
router.post('/create-battle', async (req, res) => {
    try {
        const { amount, userId } = req.body;
        const numAmount = Number(amount);

        if (!numAmount || numAmount < 10) {
            return res.status(400).json({ success: false, message: 'Minimum battle amount ₹10 honi chahiye.' });
        }

        // Check & Deduct from deposit wallet safely
        const user = await User.findOneAndUpdate(
            { _id: userId, depositWallet: { $gte: numAmount } },
            { $inc: { depositWallet: -numAmount } },
            { new: true }
        );

        if (!user) {
            return res.status(400).json({ success: false, message: 'Insufficient deposit balance or user not found!' });
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
        console.error('Error creating battle:', error);
        res.status(500).json({ success: false, message: 'Server error creating battle' });
    }
});

// 3. Join Battle
router.post('/join-battle', async (req, res) => {
    try {
        const { gameId, userId } = req.body;

        const game = await Game.findById(gameId);
        if (!game || game.status !== 'open') {
            return res.status(400).json({ success: false, message: 'Battle already started or closed' });
        }

        if (game.createdBy.toString() === userId) {
            return res.status(400).json({ success: false, message: 'You cannot join your own battle' });
        }

        // Deduct join fee safely
        const user = await User.findOneAndUpdate(
            { _id: userId, depositWallet: { $gte: game.amount } },
            { $inc: { depositWallet: -game.amount } },
            { new: true }
        );

        if (!user) {
            return res.status(400).json({ success: false, message: 'Insufficient balance to join' });
        }

        game.joinedBy = user._id;
        game.accepterPhone = user.phone;
        game.status = 'running';
        await game.save();

        res.json({
            success: true,
            game: game,
            updatedBalance: (user.depositWallet || 0) + (user.winningWallet || 0) + (user.bonusWallet || 0)
        });
    } catch (error) {
        console.error('Error joining battle:', error);
        res.status(500).json({ success: false, message: 'Server error joining battle' });
    }
});

// 4. Update Room Code
router.post('/update-roomcode', async (req, res) => {
    try {
        const { gameId, roomCode } = req.body;
        const game = await Game.findByIdAndUpdate(
            gameId,
            { roomCode: roomCode },
            { new: true }
        );

        if (!game) {
            return res.status(404).json({ success: false, message: 'Game not found' });
        }

        res.json({
            success: true,
            message: 'Room code updated successfully',
            game: game
        });
    } catch (error) {
        console.error('Error updating room code:', error);
        res.status(500).json({ success: false, message: 'Server error updating room code' });
    }
});

// 5. Get Single Battle Details
router.get('/details/:id', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
        res.json({ success: true, game });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 6. Submit Result
router.post('/submit-result', async (req, res) => {
    try {
        const { gameId, status, screenshot } = req.body;

        const updatedGame = await Game.findByIdAndUpdate(
            gameId,
            {
                status: 'review',
                resultStatus: status.toUpperCase(),
                screenshot: screenshot || ""
            },
            { new: true }
        );

        if (!updatedGame) {
            return res.status(404).json({ success: false, message: 'Game not found' });
        }

        res.json({
            success: true,
            message: 'Result submitted successfully',
            game: updatedGame
        });
    } catch (error) {
        console.error('Submit Result Error:', error);
        res.status(500).json({ success: false, message: 'Server error submitting result' });
    }
});

module.exports = router;