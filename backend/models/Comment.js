// models/Comment.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
    hidden: { type: Boolean, default: false },
}, { timestamps: true });

// Helpful compound index for pagination by thread
CommentSchema.index({ postId: 1, parentComment: 1, hidden: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', CommentSchema);