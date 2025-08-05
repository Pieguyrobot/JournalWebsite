const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import your route files
const authRoutes = require('./routes/auth.js');
const postRoutes = require('./routes/posts.js');
const commentRoutes = require('./routes/comments.js');  // Optional, if you want
const userRoutes = require('./routes/users'); // or auth.js if you added it there

// Initialize express app
const app = express();

// CORS configuration to allow frontend to make requests
const corsOptions = {
    origin: 'http://pieguyrobot.com:3000', // Allow requests from your frontend domain
    methods: 'GET, POST, PUT, DELETE',
    allowedHeaders: 'Content-Type, Authorization'
};

// Apply CORS settings
app.use(cors(corsOptions));

// Parse JSON bodies for incoming requests
app.use(express.json());

// Log the Mongo URI (to make sure it's being loaded correctly)
console.log("Mongo URI:", process.env.MONGO_URI);

// Connect to MongoDB using mongoose
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Set up API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes); // Optional
app.use('/api/users', userRoutes);

// Test route to verify if the API is running
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Set port and start the server (listening on 0.0.0.0 for external access)
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});