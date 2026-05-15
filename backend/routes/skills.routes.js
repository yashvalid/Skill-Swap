const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middlewares/authentication');
const skillsController = require('../controllers/skills.controllers')

const { cache } = require('../middlewares/cache');

router.post('/add-skills',
    body('skill').isLength({ min: 2 }).withMessage("Skill required"),
    body('des').isLength({ min: 5 }).withMessage("Description is required"),
    authMiddleware.authUser,
    skillsController.addSkill
)

router.get('/get-skills',
    authMiddleware.authUser,
    cache(300, (req) => `cache:skills:${req.user._id}`),
    skillsController.getSkills
)

router.get('/get-skillsToLearn',
    authMiddleware.authUser,
    cache(300, (req) => `cache:skillsToLearn:${req.user._id}`),
    skillsController.getSkillsToLearn
)

router.post('/delete-skill',
    body('skillId').isLength({ min: 5 }).withMessage("Id is required"),
    authMiddleware.authUser,
    skillsController.deleteSkill
)

router.post('/skills-to-learn',
    body('skill').isLength({ min: 2 }).withMessage("Skill required"),
    body('des').isLength({ min: 5 }).withMessage("Description is required"),
    authMiddleware.authUser,
    skillsController.addSkillsToLearn
)

module.exports = router