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

if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

const configuredOrigins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL;
const allowedOrigins = configuredOrigins
    ? configuredOrigins.split(',').map(o => o.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'];

const isOriginAllowed = (origin) => {
    if (!origin) return true;
    if (process.env.NODE_ENV !== 'production') return true;
    return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
};

const corsOptions = {
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
    return res.send("Server is up and running");
});
app.use("/users", userRoutes);
app.use("/skillswap", SkillSwapRoutes);
app.use("/skill", SkillRoutes);
app.use("/messages", MessagesRoutes);
app.use("/posts", postRoutes);
app.use("/ai", aiRoutes);

app.use((req, res, next) => {
    if (req.method === 'GET' && req.accepts('html')) {
        const indexPath = path.join(__dirname, 'public', 'index.html');
        return res.sendFile(indexPath, (err) => (err ? next() : undefined));
    }
    return next();
});

app.use((err, req, res, _next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds 10MB limit' });
    }
    if (err.message === 'Only images and videos are allowed!') {
        return res.status(400).json({ message: err.message });
    }
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: 'Origin not allowed by CORS' });
    }
    console.error('[Express Error]', err);
    return res.status(err.status || 500).json({ message: 'Internal server error' });
});

module.exports = app;
module.exports.isOriginAllowed = isOriginAllowed;
