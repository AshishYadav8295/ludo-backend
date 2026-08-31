const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// 1. Withdrawal Request
router.post('/withdraw-request', async (req, res) => {
    try {
        const { userId, amount, upiId } = req.body;
        const withdrawAmount = Number(amount);

        if (!withdrawAmount || withdrawAmount < 50) {
            return res.status(400).json({ success: false, message: 'Minimum withdrawal ₹50 hai.' });
        }

        const user = await User.findOneAndUpdate(
            { _id: userId, winningWallet: { $gte: withdrawAmount } },
            { $inc: { winningWallet: -withdrawAmount } },
            { new: true }
        );

        if (!user) {
            return res.status(400).json({ success: false, message: 'Winning Wallet mein sufficient balance nahi hai!' });
        }

        const txn = new Transaction({
            userId: user._id,
            type: 'WITHDRAWAL',
            amount: withdrawAmount,
            upiId: upiId || 'N/A',
            status: 'PENDING'
        });

        await txn.save();
        res.json({ success: true, message: 'Withdrawal Request Successfully Submit Ho Gayi!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. Admin: Process Withdrawal (Approve / Reject)
router.post('/process-withdrawal', async (req, res) => {
    try {
        const { txnId, action } = req.body;
        const txn = await Transaction.findById(txnId);

        if (!txn || txn.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: 'Invalid Transaction' });
        }

        if (action === 'APPROVE') {
            txn.status = 'SUCCESS';
            txn.remark = 'Paid via UPI';
        } else {
            txn.status = 'REJECTED';
            txn.remark = 'Rejected & Refunded by Admin';
            await User.findByIdAndUpdate(txn.userId, { $inc: { winningWallet: txn.amount } });
        }

        await txn.save();
        res.json({ success: true, message: `Withdrawal ${action}ed!` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;