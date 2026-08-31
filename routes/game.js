const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');

// Get all open battles
router.get('/open-battles', async (req, res) => {
    try {
        const battles = await Game.find({ status: 'open' }).sort({ createdAt: -1 });
        res.json(battles);
    } catch (error) {
        console.error('Error fetching battles:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create Battle
router.post('/create-battle', async (req, res) => {
    try {
        const { amount, userId } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.balance < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient balance!' });
        }

        user.balance -= amount;
        await user.save();

        const newGame = new Game({
            createdBy: user._id,
            creatorPhone: user.phone,
            amount: amount,
            status: 'open'
        });

        await newGame.save();

        res.json({
            success: true,
            game: newGame,
            updatedBalance: user.balance
        });
    } catch (error) {
        console.error('Error creating battle:', error);
        res.status(500).json({ success: false, message: 'Server error creating battle' });
    }
});

// Join Battle
router.post('/join-battle', async (req, res) => {
    try {
        const { gameId, userId } = req.body;
        const game = await Game.findById(gameId);
        const user = await User.findById(userId);

        if (!game || !user) {
            return res.status(404).json({ success: false, message: 'Game or User not found' });
        }

        if (game.status !== 'open') {
            return res.status(400).json({ success: false, message: 'Battle already started or closed' });
        }

        if (game.createdBy.toString() === userId) {
            return res.status(400).json({ success: false, message: 'You cannot join your own battle' });
        }

        if (user.balance < game.amount) {
            return res.status(400).json({ success: false, message: 'Insufficient balance to join' });
        }

        user.balance -= game.amount;
        await user.save();

        game.joinedBy = user._id;
        game.accepterPhone = user.phone;
        game.status = 'running';
        await game.save();

        res.json({
            success: true,
            game: game,
            updatedBalance: user.balance
        });
    } catch (error) {
        console.error('Error joining battle:', error);
        res.status(500).json({ success: false, message: 'Server error joining battle' });
    }
});

// Update Room Code (Naya Endpoint - Fixing Error)
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

// Get Single Battle Details
router.get('/details/:id', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ success: false });
        res.json({ success: true, game });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Submit Result
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