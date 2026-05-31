const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./db/db');
const userRoutes = require('./routes/user.routes');
const SkillSwapRoutes = require('./routes/skillSwap.routes');
const SkillRoutes = require('./routes/skills.routes');
const MessagesRoutes = require('./routes/messages.routes');
const postRoutes = require('./routes/post.routes');
const path = require('path');

const app = express();

connectDB();

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
}
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static('public'));

app.get('/health', (req, res) => {
    return res.send("Server is up and running");
})
app.use("/users", userRoutes);
app.use("/skillswap", SkillSwapRoutes);
app.use("/skill", SkillRoutes);
app.use("/messages", MessagesRoutes);
app.use("/posts", postRoutes);

module.exports = app; 
