const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authUser, optionalAuth } = require('../middlewares/authentication');

const requestCounts = new Map();
const aiRateLimit = (maxRequests = 30, windowMs = 60 * 1000) => (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next();
    const key = req.user?._id?.toString() || req.ip || 'anonymous';
    const now = Date.now();
    const record = requestCounts.get(key);

    if (!record || now > record.resetAt) {
        requestCounts.set(key, { count: 1, resetAt: now + windowMs });
        return next();
    }
    if (record.count >= maxRequests) {
        return res.status(429).json({ message: 'Too many AI requests. Please slow down.' });
    }
    record.count += 1;
    return next();
};

router.post('/generate-curriculum', authUser, aiRateLimit(20), aiController.generateCurriculum);
router.post('/enhance-pitch', authUser, aiRateLimit(20), aiController.enhancePitch);
router.post('/extract-skills', authUser, aiRateLimit(20), aiController.extractProfileSkills);
router.post('/compatibility', authUser, aiRateLimit(40), aiController.getCompatibility);
router.post('/chat-tutor', authUser, aiRateLimit(30), aiController.askTutor);
router.get('/recommended-matches', optionalAuth, aiRateLimit(60), aiController.getRecommendedMatches);
router.post('/match-by-interest', optionalAuth, aiRateLimit(40), aiController.matchByInterest);

module.exports = router;
