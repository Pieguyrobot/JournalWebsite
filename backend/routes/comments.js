const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify token
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
}

// GET /api/comments/:postId
router.get('/:postId', async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId })
            .populate('author', 'displayName username')
            .sort({ createdAt: 1 });
        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching comments' });
    }
});

// POST /api/comments
router.post('/', authenticate, async (req, res) => {
    try {
        const { postId, content, parentComment } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const comment = new Comment({
            postId,
            content,
            parentComment: parentComment || null,
            author: user._id,
        });

        await comment.save();
        await comment.populate('author', 'displayName username');
        res.status(201).json({ message: 'Comment added', comment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error adding comment' });
    }
});

module.exports = router;