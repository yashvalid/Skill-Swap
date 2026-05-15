const User = require('../model/user.model');
const { validationResult } = require('express-validator');
const userService = require('../services/user.services');

module.exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });
    
    const { fullname, email, password, role, location, bio } = req.body;
    
    try{
        const userExists = await User.findOne({ email });
        if(userExists)
            return res.status(409).json({ message: "User already exists" });
        const HashPassword = await User.hashPass(password);
        const user = await userService.registerUser({ 
            firstname: fullname.firstname,
            lastname: fullname.lastname,
            email,
            password : HashPassword,
            role : role,
            location : location,
            bio : bio
         });
         return res.status(201).json({ message: "User registered successfully", user });
    } catch(err){
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.userLogin = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });
    
    const { email, password } = req.body;
    
    try{
        const user = await User.findOne({email}).select('+password');
        if(!user)
            return res.status(404).json({ message: "User not found" });

        const isMatch = await user.comparePass(password);
        
        if(!isMatch)
            return res.status(401).json({ message: "Invalid credentials" });
        
        const token = await user.generateToken();
        res.cookie("token",token);
        return res.status(201).json({ token, user });
    } catch(err){
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.getUserProfile = async (req, res) =>{
    try{
        const user = await User.findById(req.user._id).select('-password -__v');
        if(!user)
            return res.status(404).json({ message: "User not found" });
        return res.status(201).json({ user });
    } catch(err){
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.getAllUsers = async (req, res) => {
    try{
        const users = await User.find({_id : { $ne: req.user._id }})
        if(!users)
            return res.status(404).json({message : "Could not get users"});
        return res.status(201).json({users});
    } catch(err){
        return res.status(500).json({error : "internal server error", err});
    }
}

module.exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -__v').populate('ratings.user', 'fullname email');
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ user });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.updateProfile = async (req, res) => {
    try {
        const updates = req.body;
        // Don't allow password or email updates through this route
        delete updates.password;
        delete updates.email;
        
        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password -__v');
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ message: "Profile updated successfully", user });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.rateUser = async (req, res) => {
    try {
        const { rating, review } = req.body;
        const targetUserId = req.params.id;
        const reviewerId = req.user._id;

        if (targetUserId === reviewerId.toString()) {
            return res.status(400).json({ message: "You cannot rate yourself" });
        }

        const user = await User.findById(targetUserId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check if already rated
        const existingRatingIndex = user.ratings.findIndex(r => r.user.toString() === reviewerId.toString());
        
        if (existingRatingIndex >= 0) {
            // Update existing rating
            user.ratings[existingRatingIndex].rating = rating;
            user.ratings[existingRatingIndex].review = review;
        } else {
            // Add new rating
            user.ratings.push({ user: reviewerId, rating, review });
            user.totalRatings += 1;
        }

        // Calculate average
        const totalSum = user.ratings.reduce((sum, r) => sum + r.rating, 0);
        user.averageRating = totalSum / user.ratings.length;

        await user.save();
        return res.status(200).json({ message: "Rating submitted successfully", averageRating: user.averageRating });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}