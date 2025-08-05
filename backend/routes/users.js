const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// PUT /api/users/display-name
router.put('/display-name', authMiddleware, async (req, res) => {
    const { newDisplayName } = req.body;

    if (!newDisplayName) {
        return res.status(400).json({ message: 'Display name is required' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.displayName = newDisplayName;
        await user.save();

        res.json({ message: 'Display name updated', displayName: user.displayName });
    } catch (err) {
        console.error('Error updating display name:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;