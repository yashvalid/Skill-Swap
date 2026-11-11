const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authUser, optionalAuth } = require('../middlewares/authentication');
const { createRateLimiter } = require('../middlewares/rateLimit');

const aiRateLimit = (maxRequests = 30, windowMs = 60 * 1000) => createRateLimiter({
    max: maxRequests,
    windowMs,
    prefix: 'ai',
    keyGenerator: (req) => `${req.path}:${req.user?._id?.toString() || req.ip || 'anonymous'}`,
    message: 'Too many AI requests. Please slow down.'
});

router.post('/generate-curriculum', authUser, aiRateLimit(20), aiController.generateCurriculum);
router.post('/enhance-pitch', authUser, aiRateLimit(20), aiController.enhancePitch);
router.post('/extract-skills', authUser, aiRateLimit(20), aiController.extractProfileSkills);
router.post('/compatibility', authUser, aiRateLimit(40), aiController.getCompatibility);
router.post('/chat-tutor', authUser, aiRateLimit(30), aiController.askTutor);
router.get('/recommended-matches', optionalAuth, aiRateLimit(60), aiController.getRecommendedMatches);
router.post('/match-by-interest', optionalAuth, aiRateLimit(40), aiController.matchByInterest);

module.exports = router;
