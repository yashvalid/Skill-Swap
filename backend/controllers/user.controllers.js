const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../model/user.model');
const SkillSwap = require('../model/skillSwap.model');
const Skills = require('../model/Skills.model');
const Messages = require('../model/message.model');
const { postModel, commentModel } = require('../model/post.model');
const { invalidateCache } = require('../middlewares/cache');
const { validationResult } = require('express-validator');
const userService = require('../services/user.services');

const DEFAULT_STUN_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
];

const buildIceServers = (userId) => {
    const stunUrls = process.env.STUN_URLS
        ? process.env.STUN_URLS.split(',').map(u => u.trim()).filter(Boolean)
        : null;
    const iceServers = stunUrls?.length
        ? stunUrls.map(urls => ({ urls }))
        : [...DEFAULT_STUN_SERVERS];

    const turnUrls = process.env.TURN_URLS
        ? process.env.TURN_URLS.split(',').map(u => u.trim()).filter(Boolean)
        : [];

    if (turnUrls.length > 0 && userId) {
        if (process.env.TURN_STATIC_SECRET) {
            const ttlSeconds = Number(process.env.TURN_TTL_SECONDS) || 3600;
            const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;
            const username = `${expiry}:${userId.toString()}`;
            const credential = crypto
                .createHmac('sha1', process.env.TURN_STATIC_SECRET)
                .update(username)
                .digest('base64');
            iceServers.push({ urls: turnUrls, username, credential });
        } else if (process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
            iceServers.push({
                urls: turnUrls,
                username: process.env.TURN_USERNAME,
                credential: process.env.TURN_CREDENTIAL
            });
        }
    }

    return iceServers;
};

const PUBLIC_USER_PROJECTION = 'fullname role location bio skillsOffered skillsNeeded averageRating totalRatings ratings isVerified publicKey credits';

const getCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    };
};

module.exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const { fullname, email, password, role, location, bio, agreedToPrivacyPolicy, privacyPolicyAccepted } = req.body;

    if (!agreedToPrivacyPolicy && !privacyPolicyAccepted) {
        return res.status(422).json({ message: "You must read and agree to the Privacy Policy to create an account" });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists)
            return res.status(409).json({ message: "User already exists" });

        const HashPassword = await User.hashPass(password);
        const user = await userService.registerUser({
            firstname: fullname.firstname.trim(),
            lastname: fullname.lastname ? fullname.lastname.trim() : '',
            email: normalizedEmail,
            password: HashPassword,
            role: role.trim(),
            location: location.trim(),
            bio: bio.trim(),
            privacyPolicyAccepted: true,
            privacyPolicyAcceptedAt: new Date(),
            privacyPolicyVersion: '1.0'
        });

        const token = user.generateToken();
        res.cookie("token", token, getCookieOptions());
        return res.status(201).json({ message: "User registered successfully", token, user });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.userLogin = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
        if (!user)
            return res.status(404).json({ message: "User not found" });

        const isMatch = await user.comparePass(password);
        if (!isMatch)
            return res.status(401).json({ message: "Invalid credentials" });

        const token = user.generateToken();
        res.cookie("token", token, getCookieOptions());
        return res.status(200).json({ token, user });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.userLogout = (req, res) => {
    const { maxAge: _maxAge, ...clearOpts } = getCookieOptions();
    res.clearCookie("token", clearOpts);
    return res.status(200).json({ message: "Logged out successfully" });
};

module.exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -__v');
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ user });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.getAllUsers = async (req, res) => {
    try {
        const filter = req.user?._id ? { _id: { $ne: req.user._id } } : {};
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50)) : 0;

        let query = User.find(filter).select(PUBLIC_USER_PROJECTION);
        if (limit > 0) {
            query = query.skip((page - 1) * limit).limit(limit);
        }
        const users = await query;
        return res.status(200).json({ users: users || [] });
    } catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.getUserById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        const user = await User.findById(req.params.id)
            .select(PUBLIC_USER_PROJECTION)
            .populate('ratings.user', 'fullname role isVerified');
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ user });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.updateProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    try {
        const allowedFields = {};
        if (typeof req.body.bio === 'string') allowedFields.bio = req.body.bio.trim();
        if (typeof req.body.location === 'string') allowedFields.location = req.body.location.trim();
        if (typeof req.body.role === 'string') allowedFields.role = req.body.role.trim();
        if (typeof req.body.publicKey === 'string' || req.body.publicKey === null) {
            allowedFields.publicKey = req.body.publicKey;
        }
        if (req.body.fullname && typeof req.body.fullname === 'object') {
            if (typeof req.body.fullname.firstname === 'string' && req.body.fullname.firstname.trim()) {
                allowedFields['fullname.firstname'] = req.body.fullname.firstname.trim();
            }
            if (typeof req.body.fullname.lastname === 'string') {
                allowedFields['fullname.lastname'] = req.body.fullname.lastname.trim();
            }
        }

        if (Object.keys(allowedFields).length === 0) {
            return res.status(400).json({ message: "No valid profile fields provided" });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: allowedFields },
            { new: true, runValidators: true }
        ).select('-password -__v');
        if (!user) return res.status(404).json({ message: "User not found" });
        if (allowedFields.publicKey !== undefined) {
            await invalidateCache('cache:swaps:accepted:*');
        }
        return res.status(200).json({ message: "Profile updated successfully", user });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.rateUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    try {
        const ratingValue = Number(req.body.rating);
        const review = typeof req.body.review === 'string' ? req.body.review.trim() : '';
        const targetUserId = req.params.id;
        const reviewerId = req.user._id;

        if (!mongoose.isValidObjectId(targetUserId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        if (targetUserId === reviewerId.toString()) {
            return res.status(400).json({ message: "You cannot rate yourself" });
        }

        if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        const hasSwapConnection = await SkillSwap.exists({
            status: { $in: ['accepted', 'completed'] },
            $or: [
                { fromUser: reviewerId, toUser: targetUserId },
                { fromUser: targetUserId, toUser: reviewerId }
            ]
        });

        if (!hasSwapConnection) {
            return res.status(403).json({ message: "You can only rate partners from an active or completed swap" });
        }

        const user = await User.findById(targetUserId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const existingRatingIndex = user.ratings.findIndex(r => r.user.toString() === reviewerId.toString());

        if (existingRatingIndex >= 0) {
            user.ratings[existingRatingIndex].rating = ratingValue;
            user.ratings[existingRatingIndex].review = review;
        } else {
            user.ratings.push({ user: reviewerId, rating: ratingValue, review });
        }

        user.totalRatings = user.ratings.length;
        const totalSum = user.ratings.reduce((sum, r) => sum + r.rating, 0);
        user.averageRating = totalSum / user.ratings.length;
        if (user.ratings.length >= 1) {
            user.isVerified = true;
        }

        await user.save();
        return res.status(200).json({ message: "Rating submitted successfully", averageRating: user.averageRating });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.buildIceServers = buildIceServers;

module.exports.getIceServers = async (req, res) => {
    try {
        const iceServers = buildIceServers(req.user._id);
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ iceServers });
    } catch {
        return res.status(500).json({ message: "Failed to build ICE server configuration" });
    }
};

module.exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        const userPosts = await postModel.find({ user: userId }).select('_id').lean();
        const userPostIds = userPosts.map(p => p._id);

        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        await Promise.all([
            Skills.deleteMany({ user: userId }),
            SkillSwap.deleteMany({ $or: [{ fromUser: userId }, { toUser: userId }] }),
            Messages.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }),
            postModel.deleteMany({ user: userId }),
            commentModel.deleteMany(
                userPostIds.length > 0
                    ? { $or: [{ user: userId }, { post: { $in: userPostIds } }] }
                    : { user: userId }
            ),
        ]);

        await invalidateCache([
            'cache:/posts/all*',
            `cache:messages:*${userId}*`,
            `cache:swaps:accepted:${userId}`,
            'cache:swaps:accepted:*'
        ]);

        const { maxAge: _maxAge, ...clearOpts } = getCookieOptions();
        res.clearCookie('token', clearOpts);
        return res.status(200).json({ message: "Account and associated data deleted successfully" });
    } catch {
        return res.status(500).json({ message: "Failed to delete account" });
    }
};
