import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';  // adjust path if needed

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const users = await User.find({});
        console.log('Users in DB:', users);

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

test();