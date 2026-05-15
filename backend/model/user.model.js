const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    fullname : {
        firstname : {
            type : String,
            required : true,
        },
        lastname : {
            type : String
        }
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
    },
    password : {
        type : String,
        required : true,
        select : false,
    },
    socketId : {
        type : String
    },
    skillsOffered : {
        type : [String],
        default : []
    },
    skillsNeeded : {
        type : [String],
        default : []
    },
    location : {
        type : String,
    },
    role : {
        type : String,
        requried : true
    },
    bio : {
        type : String,
        required : true
    },
    ratings: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        rating: { type: Number, required: true },
        review: { type: String }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    totalRatings: {
        type: Number,
        default: 0
    }
});

userSchema.methods.generateToken = function() {
    const token = jwt.sign({ _id : this._id }, process.env.JWT_SECRET);
    console.log("token generated", token);
    return token;
}

userSchema.methods.comparePass = async function(password){
    return await bcrypt.compare(password, this.password);
}

userSchema.statics.hashPass = async function(password){
    return await bcrypt.hash(password, 10);
}

const User = mongoose.model('user', userSchema);

module.exports = User;