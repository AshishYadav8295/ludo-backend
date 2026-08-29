const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middlewares
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

// Socket Event Connection
io.on('connection', (socket) => {
    console.log('⚡ New User Connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('❌ User Disconnected:', socket.id);
    });
});

// Express app me io share karne ke liye middleware
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes Setup
app.use('/api/auth', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));

const walletRoutes = require('./routes/wallet');
app.use('/api/wallet', walletRoutes);

// Basic Test Route
app.get('/', (req, res) => {
    res.send('Ludo Platform Backend & Socket Server is Running Perfectly!');
});

// Database Connection & Server Start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected Successfully!');
        server.listen(PORT, () => {
            console.log(`Server started running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log('Database Connection Failure:', err.message);
    });