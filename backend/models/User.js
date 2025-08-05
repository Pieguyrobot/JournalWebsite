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
        default: 'Unknown',
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    }
});

module.exports = mongoose.model('User', UserSchema);