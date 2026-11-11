const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middlewares/authentication');
const skillsController = require('../controllers/skills.controllers')

const { cache } = require('../middlewares/cache');

router.post('/add-skills',
    authMiddleware.authUser,
    body('skill').trim().isLength({ min: 2 }).withMessage("Skill required"),
    body('des').trim().isLength({ min: 5 }).withMessage("Description is required"),
    skillsController.addSkill
);

router.get('/get-skills',
    authMiddleware.authUser,
    cache(300, (req) => `cache:skills:${req.user._id}`),
    skillsController.getSkills
);

router.get('/get-skillsToLearn',
    authMiddleware.authUser,
    cache(300, (req) => `cache:skillsToLearn:${req.user._id}`),
    skillsController.getSkillsToLearn
);

router.post('/delete-skill',
    authMiddleware.authUser,
    body('skillId').isLength({ min: 5 }).withMessage("Id is required"),
    skillsController.deleteSkill
);

router.post('/skills-to-learn',
    authMiddleware.authUser,
    body('skill').trim().isLength({ min: 2 }).withMessage("Skill required"),
    body('des').trim().isLength({ min: 5 }).withMessage("Description is required"),
    skillsController.addSkillsToLearn
);

module.exports = router;