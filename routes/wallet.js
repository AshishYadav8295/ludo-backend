const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// 1. Withdrawal Request Send Karein (User)
router.post('/withdraw-request', async (req, res) => {
    try {
        const { userId, amount, upiId } = req.body;
        const withdrawAmount = Number(amount);

        if (!withdrawAmount || withdrawAmount < 50) {
            return res.status(400).json({ success: false, message: 'Minimum withdrawal ₹50 hai.' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User nahi mila.' });

        if (user.winWallet < withdrawAmount) {
            return res.status(400).json({ success: false, message: 'Winning wallet mein balance kam hai.' });
        }

        // Deduct balance from winning wallet temporary
        user.winWallet -= withdrawAmount;
        await user.save();

        // Create Pending Transaction
        const txn = new Transaction({
            userId: userId, // 'user' ki jagah 'userId' karein
            type: 'WITHDRAWAL',
            amount: withdrawAmount,
            status: 'PENDING',
            upiId: upiId
        });

        await txn.save();
        res.json({ success: true, message: 'Withdrawal request submit ho gayi!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. User Passbook / Transaction History
router.get('/history/:userId', async (req, res) => {
    try {
        const history = await Transaction.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. Admin: Pending Withdrawals Fetch Karein
router.get('/pending-withdrawals', async (req, res) => {
    try {
        const list = await Transaction.find({ type: 'WITHDRAWAL', status: 'PENDING' })
            .populate('user', 'phone')
            .sort({ createdAt: -1 });
        res.json({ success: true, list });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. Admin: Approve / Reject Withdrawal
router.post('/process-withdrawal', async (req, res) => {
    try {
        const { txnId, action } = req.body; // action: 'APPROVE' ya 'REJECT'
        const txn = await Transaction.findById(txnId);

        if (!txn || txn.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: 'Invalid Transaction' });
        }

        if (action === 'APPROVE') {
            txn.status = 'SUCCESS';
            txn.remark = 'Paid successfully to ' + txn.upiId;
        } else {
            txn.status = 'REJECTED';
            txn.remark = 'Rejected by Admin. Amount refunded.';
            // Balance Refund
            await User.findByIdAndUpdate(txn.user, { $inc: { winWallet: txn.amount } });
        }

        await txn.save();
        res.json({ success: true, message: `Withdrawal ${action} successfully!` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;