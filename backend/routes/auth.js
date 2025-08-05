const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.js');
require('dotenv').config();
const authMiddleware = require('../middleware/authMiddleware'); // Make sure it's imported

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, username: user.username, displayName: user.displayName, role: user.role, }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                role: user.role,
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Register
router.post('/register', async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    if (!username || !password || !confirmPassword)
        return res.status(400).json({ message: 'All fields are required' });

    if (password !== confirmPassword)
        return res.status(400).json({ message: 'Passwords do not match' });

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser)
            return res.status(409).json({ message: 'Username already exists' });

        const passwordHash = await bcrypt.hash(password, 12);

        const newUser = new User({
            username,
            passwordHash,
            displayName: 'Unknown',
            role: 'user',
        });

        await newUser.save();

        const token = jwt.sign(
            { id: newUser._id,},
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                displayName: newUser.displayName,
                role: newUser.role,
            },
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// GET /api/auth/me - fetch current user info
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            id: user._id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
        });
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/auth/verify
router.get('/verify', require('../middleware/authMiddleware'), (req, res) => {
    res.json({ message: 'Token valid', user: req.user });
});

module.exports = router;