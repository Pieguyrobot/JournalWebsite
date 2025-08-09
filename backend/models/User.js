const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    displayName: {
        type: String,
        unique: true,
        default: null,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'owner'],
        default: 'user',
    },
    passwordChangedAt: { 
        type: Date, 
        default: null 
    },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);