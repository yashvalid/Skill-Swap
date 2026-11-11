const jwt = require('jsonwebtoken');
const User = require('../model/user.model');

const verifyJwtToken = async (token) => {
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) return null;
    return { decoded, user };
};

const extractToken = (req) => {
    return req.cookies?.token || req.headers['authorization']?.split(' ')[1];
};

module.exports.verifyJwtToken = verifyJwtToken;

module.exports.authUser = async (req, res, next) => {
    try {
        const result = await verifyJwtToken(extractToken(req));
        if (!result)
            return res.status(401).json({ message: "Unauthorized" });
        req.user = result.decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};

module.exports.optionalAuth = async (req, res, next) => {
    try {
        const result = await verifyJwtToken(extractToken(req));
        if (result) {
            req.user = result.decoded;
        }
    } catch (err) {
        // Continue unauthenticated for optional endpoints
    }
    next();
};
