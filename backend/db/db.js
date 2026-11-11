const mongoose = require('mongoose');

function connectDB() {
    return mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
    })
        .then(() => console.log("MongoDB connected"))
        .catch((err) => {
            console.error("MongoDB connection failed:", err.message);
            process.exit(1);
        });
}

module.exports = connectDB;