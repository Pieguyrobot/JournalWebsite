const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/users - Admins/Owners can view all users
router.get('/', authMiddleware, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser || !['admin', 'owner'].includes(currentUser.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const users = await User.find({}, 'id username displayName role');
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/users/display-name - update own or anyone's name (admin/owner)
router.put('/:id/display-name', authMiddleware, async (req, res) => {
    const rawName = req.body.newDisplayName?.trim();
    const targetUserId = req.params.id;

    if (!rawName || rawName.includes(' ')) {
        return res.status(400).json({ message: 'Display name cannot be empty or contain spaces.' });
    }

    try {
        const requester = await User.findById(req.user.id);
        const targetUser = await User.findById(targetUserId);

        if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

        // ✅ Prevent editing the owner's display name unless it's the owner editing themselves
        if (targetUser.role === 'owner' && requester.role !== 'owner') {
            return res.status(403).json({ message: 'Only the owner can modify the owner.' });
        }

        // ✅ Prevent owner from editing another owner's display name
        if (
            targetUser.role === 'owner' &&
            requester.role === 'owner' &&
            requester.id !== targetUser.id
        ) {
            return res.status(403).json({ message: 'Owner cannot change another owner.' });
        }

        // ✅ Users can only edit their own name
        if (requester.role === 'user' && requester.id !== targetUser.id) {
            return res.status(403).json({ message: 'Unauthorized to change this user’s display name.' });
        }

        const existing = await User.findOne({ displayName: rawName });
        if (existing && existing._id.toString() !== targetUser._id.toString()) {
            return res.status(409).json({ message: 'Display name already in use.' });
        }

        targetUser.displayName = rawName;
        await targetUser.save();

        res.json({ message: 'Display name updated', displayName: targetUser.displayName });
    } catch (err) {
        console.error('Error updating display name:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/users/:id/role
router.put('/:id/role', authMiddleware, async (req, res) => {
    const { newRole } = req.body;

    // Allow only owners
    if (req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Only owner can change roles.' });
    }

    if (!['admin', 'user'].includes(newRole)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        if (targetUser.role === 'owner') {
            return res.status(403).json({ message: 'Cannot change owner role' });
        }

        targetUser.role = newRole;
        await targetUser.save();

        res.json({ message: 'Role updated successfully', newRole });
    } catch (err) {
        console.error('Error updating role:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
