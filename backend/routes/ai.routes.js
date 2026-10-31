const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authUser } = require('../middlewares/authentication');

router.post('/generate-curriculum', authUser, aiController.generateCurriculum);
router.post('/enhance-pitch', authUser, aiController.enhancePitch);
router.post('/extract-skills', authUser, aiController.extractProfileSkills);
router.post('/compatibility', authUser, aiController.getCompatibility);
router.post('/chat-tutor', authUser, aiController.askTutor);

module.exports = router;
