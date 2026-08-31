const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// 1. Core Security & Payload Handling (Allows large screenshots up to 50MB)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. Serve Static Frontend Files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// 3. Database Connection Logic
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ludo-platform';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('====================================');
        console.log('MongoDB Connected Successfully!');
        console.log('====================================');
    })
    .catch((err) => {
        console.error('Database Connection Failed:', err.message);
    });

// 4. API Routes Setup
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const walletRoutes = require('./routes/wallet');

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/wallet', walletRoutes);

// 5. Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Ludo Server Running Perfectly' });
});

// 6. Safe SPA Fallback Middleware
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        next();
    }
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// 8. Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
});