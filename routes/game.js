const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Game = require('../models/Game');

// 1. Create Battle
router.post('/create-battle', async (req, res) => {
    try {
        const { amount, userId } = req.body;
        const entryAmount = Number(amount);

        if (!entryAmount || entryAmount < 10) {
            return res.status(400).json({ success: false, message: 'Minimum battle amount is ₹10' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found!' });

        const totalBalance = (user.depositWallet || 0) + (user.winningWallet || 0) + (user.bonusWallet || 0);
        if (totalBalance < entryAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient balance!' });
        }

        const newGame = new Game({
            createdBy: user._id,
            creatorPhone: user.phone,
            amount: entryAmount,
            status: 'open'
        });
        await newGame.save();

        if (user.depositWallet >= entryAmount) {
            user.depositWallet -= entryAmount;
        } else {
            const remaining = entryAmount - user.depositWallet;
            user.depositWallet = 0;
            user.bonusWallet = Math.max(0, user.bonusWallet - remaining);
        }
        await user.save();

        const updatedBalance = (user.depositWallet || 0) + (user.winningWallet || 0) + (user.bonusWallet || 0);

        return res.json({
            success: true,
            message: 'Battle created successfully!',
            game: newGame,
            updatedBalance: updatedBalance
        });
    } catch (error) {
        console.error('Create Battle Error:', error);
        return res.status(500).json({ success: false, message: 'Server error creating battle.' });
    }
});

// 2. Fetch Open Battles
router.get('/open-battles', async (req, res) => {
    try {
        const battles = await Game.find({ status: 'open' }).sort({ createdAt: -1 });
        return res.json(battles);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error loading battles' });
    }
});

// 3. Join Battle
router.post('/join-battle', async (req, res) => {
    try {
        const { gameId, userId } = req.body;

        if (!gameId || !userId) {
            return res.status(400).json({ success: false, message: 'Game ID and User ID required' });
        }

        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ success: false, message: 'Battle not found' });
        }

        if (game.status !== 'open') {
            return res.status(400).json({ success: false, message: 'This battle is no longer open' });
        }

        if (game.createdBy.toString() === userId.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot join your own battle!' });
        }

        const joiner = await User.findById(userId);
        if (!joiner) return res.status(404).json({ success: false, message: 'User not found' });

        const joinerBalance = (joiner.depositWallet || 0) + (joiner.winningWallet || 0) + (joiner.bonusWallet || 0);
        if (joinerBalance < game.amount) {
            return res.status(400).json({ success: false, message: 'Insufficient balance to join!' });
        }

        if (joiner.depositWallet >= game.amount) {
            joiner.depositWallet -= game.amount;
        } else {
            const remaining = game.amount - joiner.depositWallet;
            joiner.depositWallet = 0;
            joiner.bonusWallet = Math.max(0, joiner.bonusWallet - remaining);
        }
        await joiner.save();

        game.joinedBy = joiner._id;
        game.status = 'running';
        await game.save();

        const updatedBalance = (joiner.depositWallet || 0) + (joiner.winningWallet || 0) + (joiner.bonusWallet || 0);

        return res.json({
            success: true,
            message: 'Match successfully joined!',
            game: game,
            updatedBalance: updatedBalance
        });

    } catch (error) {
        console.error('Join Battle Error:', error);
        return res.status(500).json({ success: false, message: 'Server error joining battle' });
    }
});

// 4. Submit Room Code Route
router.post('/submit-room-code', async (req, res) => {
    try {
        const { gameId, roomCode } = req.body;

        if (!roomCode) {
            return res.status(400).json({ success: false, message: 'Valid Room Code enter karein!' });
        }

        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ success: false, message: 'Game nahi mil paaya!' });
        }

        game.roomCode = roomCode;
        await game.save();

        return res.json({
            success: true,
            message: 'Room Code successfully submit ho gaya!',
            roomCode: game.roomCode
        });

    } catch (error) {
        console.error('Submit Room Code Error:', error);
        return res.status(500).json({ success: false, message: 'Server error: Room code save nahi ho saka.' });
    }
});

// 5. Fetch Pending Admin Reviews
router.get('/pending-results', async (req, res) => {
    try {
        const pendingGames = await Game.find({ status: { $in: ['running', 'review'] } }).sort({ updatedAt: -1 });
        return res.json({ success: true, games: pendingGames });
    } catch (error) {
        console.error('Fetch Pending Results Error:', error);
        return res.status(500).json({ success: false, message: 'Server error loading pending reviews.' });
    }
});

module.exports = router;