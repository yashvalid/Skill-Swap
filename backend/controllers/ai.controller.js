const aiService = require('../services/ai.service');
const matchingService = require('../services/matching.services');
const User = require('../model/user.model');

module.exports.generateCurriculum = async (req, res) => {
    try {
        const { skillToLearn, skillToTeach, partnerName } = req.body;

        if (!skillToLearn || !skillToTeach) {
            return res.status(400).json({
                message: 'Both skillToLearn and skillToTeach are required'
            });
        }

        const curriculum = await aiService.generateCurriculum({
            skillToLearn,
            skillToTeach,
            partnerName: partnerName || 'Partner'
        });

        return res.status(200).json({
            success: true,
            curriculum
        });
    } catch (error) {
        console.error('Error generating curriculum:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate curriculum plan'
        });
    }
};

module.exports.enhancePitch = async (req, res) => {
    try {
        const { offersSkill, requestsSkill, partnerName, customGoal } = req.body;

        const result = await aiService.enhancePitch({
            offersSkill,
            requestsSkill,
            partnerName,
            customGoal
        });

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error enhancing pitch:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to enhance proposal pitch'
        });
    }
};

module.exports.extractProfileSkills = async (req, res) => {
    try {
        const { rawText } = req.body;
        if (!rawText || !rawText.trim()) {
            return res.status(400).json({
                message: 'Text is required for skill extraction'
            });
        }

        const result = await aiService.extractProfileSkills({ rawText });

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error extracting skills:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to extract skills'
        });
    }
};

module.exports.getCompatibility = async (req, res) => {
    try {
        const { candidateUserId } = req.body;
        const currentUserId = req.user._id;

        if (!candidateUserId) {
            return res.status(400).json({ message: 'candidateUserId is required' });
        }

        const [currentUser, candidateUser] = await Promise.all([
            User.findById(currentUserId),
            User.findById(candidateUserId)
        ]);

        if (!currentUser || !candidateUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const affinity = matchingService.calculatePairAffinity(currentUser, candidateUser);

        return res.status(200).json({
            success: true,
            compatibility: {
                score: affinity.matchScore,
                reason: affinity.whyConnect,
                synergyTags: affinity.synergyTags,
                sharedDomains: affinity.sharedDomains,
                icebreaker: affinity.icebreaker,
                breakdown: affinity.breakdown
            }
        });
    } catch (error) {
        console.error('Error calculating compatibility:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to calculate compatibility'
        });
    }
};

module.exports.getRecommendedMatches = async (req, res) => {
    try {
        const currentUserId = req.user?._id;
        let currentUser = null;
        if (currentUserId) {
            currentUser = await User.findById(currentUserId).lean();
        }

        const filter = currentUserId ? { _id: { $ne: currentUserId } } : {};
        const candidateUsers = await User.find(filter)
            .select('-password -__v')
            .lean();

        const referenceUser = currentUser || {
            _id: 'guest',
            role: 'Skill Explorer',
            bio: 'Passionate about reciprocal skill mastery, creative design, and knowledge exchange across diverse disciplines.',
            skillsOffered: ['Full Stack Development', 'Creative Collaboration'],
            skillsNeeded: ['UI/UX Design', 'Languages', 'Music Production', 'Mobile Development', 'Cloud Architecture']
        };

        const matches = matchingService.rankRecommendedPeers(referenceUser, candidateUsers, { limit: 25 });

        return res.status(200).json({
            success: true,
            isGuest: !currentUser,
            matches
        });
    } catch (error) {
        console.error('Error in getRecommendedMatches:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to compute recommended matches'
        });
    }
};

module.exports.matchByInterest = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || !query.trim()) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const currentUserId = req.user?._id;
        let currentUser = null;
        if (currentUserId) {
            currentUser = await User.findById(currentUserId);
        }

        const filter = currentUserId ? { _id: { $ne: currentUserId } } : {};
        const allUsers = await User.find(filter).select('-password -__v').lean();

        const matches = matchingService.matchByInterestQuery(query, allUsers, currentUser);

        return res.status(200).json({
            success: true,
            query,
            matches
        });
    } catch (error) {
        console.error('Error in matchByInterest:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to search by interest'
        });
    }
};

module.exports.askTutor = async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const user = await User.findById(req.user._id);
        const result = await aiService.askTutor({
            message,
            history: history || [],
            learningSkills: user?.skillsNeeded || []
        });

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error in askTutor:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to consult SkillBot'
        });
    }
};
