const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. Core Security & CORS Setup (Allows socket & cross-origin requests)
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// 2. Payload Handling (Allows large screenshot uploads up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. Serve Static Frontend Files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// 4. Database Connection Logic with Timeout Optimization
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ludo-platform';

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000 // 5 second timeout taaki request hang na ho
})
    .then(() => {
        console.log('====================================');
        console.log('MongoDB Connected Successfully!');
        console.log('====================================');
    })
    .catch((err) => {
        console.error('Database Connection Failed:', err.message);
    });

// 5. API Routes Setup
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const walletRoutes = require('./routes/wallet');

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/wallet', walletRoutes);

// 6. Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Ludo Server Running Perfectly' });
});

// 7. Safe SPA Fallback Middleware
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        next();
    }
});

// 8. Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// 9. Server Listen
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
});