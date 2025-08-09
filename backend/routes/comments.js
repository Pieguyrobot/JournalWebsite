// routes/comments.js
const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ---- auth helpers ----
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid token' });
    }
}

async function getRequester(req) {
    return User.findById(req.user.id).lean();
}

// Optional: check if requester is admin/owner when a token is present
async function isAdminish(req) {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) return false;
        const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
        const u = await User.findById(decoded.id).lean();
        return u && (u.role === 'admin' || u.role === 'owner');
    } catch {
        return false;
    }
}

// ---- basic list (legacy) ----
// Regular users: show docs where hidden != true (works for old docs with no hidden field).
router.get('/:postId', async (req, res) => {
    try {
        const adminish = await isAdminish(req);
        const baseFilter = { postId: req.params.postId };
        const filter = adminish ? baseFilter : { ...baseFilter, hidden: { $ne: true } };

        const comments = await Comment.find(filter)
            .populate('author', 'displayName username role')
            .sort({ createdAt: 1 });

        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching comments' });
    }
});

// ---- create comment ----
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
        await comment.populate('author', 'displayName username role');
        res.status(201).json({ message: 'Comment added', comment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error adding comment' });
    }
});

// ---- replies / pagination ----
router.get('/:postId/root', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    try {
        const adminish = await isAdminish(req);
        const base = { postId: req.params.postId, parentComment: null };
        const filter = adminish ? base : { ...base, hidden: { $ne: true } };

        const [items, total] = await Promise.all([
            Comment.find(filter)
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('author', 'displayName username role'),
            Comment.countDocuments(filter),
        ]);

        res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (e) {
        res.status(500).json({ message: 'Error fetching comments' });
    }
});

router.get('/:postId/replies', async (req, res) => {
    const { parent, page = 1, limit = 10 } = req.query;
    if (!parent) return res.status(400).json({ message: 'parent is required' });

    const skip = (parseInt(page) - 1) * parseInt(limit);

    try {
        const adminish = await isAdminish(req);
        const base = { postId: req.params.postId, parentComment: parent };
        const filter = adminish ? base : { ...base, hidden: { $ne: true } };

        const [items, total] = await Promise.all([
            Comment.find(filter)
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('author', 'displayName username role'),
            Comment.countDocuments(filter),
        ]);

        res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (e) {
        res.status(500).json({ message: 'Error fetching replies' });
    }
});

// ---- moderation ----

// Hide/unhide (admin & owner) — unified toggle
// PATCH /api/comments/:id/hide { hidden: true|false }
router.patch('/:id/hide', authenticate, async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester || !['admin', 'owner'].includes(requester.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { hidden } = req.body;
        if (typeof hidden !== 'boolean') {
            return res.status(400).json({ message: 'hidden must be boolean' });
        }

        // Need author's role to enforce rule
        const comment = await Comment.findById(req.params.id).populate('author', 'role');
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        // 🚫 Admin cannot moderate owner's comments
        if (requester.role === 'admin' && comment.author?.role === 'owner') {
            return res.status(403).json({ message: 'Admins cannot moderate owner comments' });
        }

        comment.hidden = hidden;
        await comment.save();
        res.json({ message: hidden ? 'Comment hidden' : 'Comment unhidden', commentId: comment._id });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete (owner only) — deletes comment and its direct replies
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester || requester.role !== 'owner') {
            return res.status(403).json({ message: 'Only owner can delete comments' });
        }

        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        await Comment.deleteMany({ $or: [{ _id: comment._id }, { parentComment: comment._id }] });

        res.json({ message: 'Comment (and its replies) deleted' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;