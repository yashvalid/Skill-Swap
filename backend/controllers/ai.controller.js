const aiService = require('../services/ai.service');
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

        const compatibility = await aiService.calculateCompatibility({
            currentUser,
            candidateUser
        });

        return res.status(200).json({
            success: true,
            compatibility
        });
    } catch (error) {
        console.error('Error calculating compatibility:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to calculate compatibility'
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
