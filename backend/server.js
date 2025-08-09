const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.js');
const postRoutes = require('./routes/posts.js');
const commentRoutes = require('./routes/comments.js');
const userRoutes = require('./routes/users');

const app = express();

// trust nginx proxy so rate-limit sees real IP
app.set('trust proxy', 1);

// CORS
const corsOptions = {
    origin: ['http://pieguyrobot.com', 'http://pieguyrobot.com:3000', 'https://pieguyrobot.com'],
    methods: 'GET, POST, PUT, DELETE',
    allowedHeaders: 'Content-Type, Authorization'
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Auth rate limits (per IP per minute) ---
const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/change-password', authLimiter);

// Healthcheck (useful for debugging 502s)
app.get('/health', (req, res) => res.json({ ok: true }));

// Mongo
console.log('Mongo URI:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);

// Root
app.get('/', (req, res) => res.send('API is running...'));

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});