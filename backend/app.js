const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./db/db');
const userRoutes = require('./routes/user.routes');
const SkillSwapRoutes = require('./routes/skillSwap.routes');
const SkillRoutes = require('./routes/skills.routes');
const MessagesRoutes = require('./routes/messages.routes');
const postRoutes = require('./routes/post.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

connectDB();

const configuredOrigins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL;
const allowedOrigins = configuredOrigins
    ? configuredOrigins.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
};
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
app.use("/ai", aiRoutes);

module.exports = app;
