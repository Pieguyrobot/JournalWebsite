// posts.js
const express = require('express');
const Post = require('../models/Post.js');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/posts - fetch newest first
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 }) // newest to oldest
            .populate('author', 'displayName');
        res.json(posts);
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({ message: 'Server error fetching posts' });
    }
});

// GET /api/posts/:id - fetch single post by ID
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', 'displayName username');
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        console.error('Error fetching post by ID:', err);
        res.status(500).json({ message: 'Server error fetching post' });
    }
});

// POST /api/posts - create new post
router.post('/', async (req, res) => {
    try {
        const { title, content, image, author } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content required' });
        }

        const newPost = new Post({ title, content, image, author });
        await newPost.save();

        res.status(201).json({ message: 'Post created', post: newPost });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ message: 'Server error creating post' });
    }
});

module.exports = router;