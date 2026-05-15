const jwt = require('jsonwebtoken');
const User = require('../model/user.model');

module.exports.authUser = async(req, res, next) =>{
    try{
        const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
        if(!token) 
            return res.status(401).json({ message: "Unauthorized" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id);
        if(!user) 
            return res.status(401).json({ message: "Unauthorized" });
        req.user = decoded;
        next();
    } catch(err){
        return res.status(401).json({ message: "Unauthorized" });
    }
}