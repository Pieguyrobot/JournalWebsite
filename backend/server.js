
const dotenv = require('dotenv');
dotenv.config();
console.log("Mongo URI:", process.env.MONGO_URI); // Add this line to check if the MONGO_URI is loaded


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth.js');
const postRoutes = require('./routes/posts.js');
const commentRoutes = require('./routes/comments.js');  // optional if you want
const userRoutes = require('./routes/users'); // or auth.js if you added it there

const app = express();

app.use(cors());
app.use(express.json());

console.log(process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));


app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes); // optional
app.use('/api/users', userRoutes);


app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0',() => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});