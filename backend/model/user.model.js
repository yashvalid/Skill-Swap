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
        required : true
    },
    bio : {
        type : String,
        required : true
    },
    credits: {
        type: Number,
        default: 3
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
    },
    privacyPolicyAccepted: {
        type: Boolean,
        default: false
    },
    privacyPolicyAcceptedAt: {
        type: Date,
        default: null
    },
    privacyPolicyVersion: {
        type: String,
        default: '1.0'
    },
    publicKey: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
});

userSchema.methods.generateToken = function() {
    const token = jwt.sign({ _id : this._id }, process.env.JWT_SECRET);
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
