const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return res.status(401).json({ message: 'Invalid token' });
    }

    // Load user to check passwordChangedAt vs token iat
    const user = await User.findById(decoded.id).select('passwordChangedAt role username displayName');
    if (!user) return res.status(401).json({ message: 'Invalid user' });

    if (user.passwordChangedAt) {
        const pwdChanged = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
        if (decoded.iat && decoded.iat < pwdChanged) {
            return res.status(401).json({ message: 'Token expired due to password change' });
        }
    }

    req.user = { ...decoded, role: user.role };
    next();
}

module.exports = authMiddleware;