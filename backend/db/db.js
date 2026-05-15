const mongoose = require('mongoose');

function connectDB() {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log("MongoDB connected"));
}

module.exports = connectDB;