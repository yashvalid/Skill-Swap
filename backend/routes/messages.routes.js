const express = require('express');
const router = express.Router();
const authMiddleWare = require('../middlewares/authentication');
const { query, body } = require('express-validator');
const messagesController = require('../controllers/messages.controllers');
const { cache } = require('../middlewares/cache');

router.get('/get-messages',
    query('userToChatId').notEmpty().withMessage('UserToChatId is required'),
    authMiddleWare.authUser,
    cache(300, (req) => `cache:messages:${req.user._id}:${req.query.userToChatId}`),
    messagesController.getMessages
);

router.post('/send-message',
    body('text').custom((val, { req }) => {
        if (!val && !req.body.message && !req.body.content) {
            throw new Error('Message text is required');
        }
        return true;
    }),
    body('receiverId').custom((val, { req }) => {
        if (!val && !req.body.to && !req.body.receiver) {
            throw new Error('Receiver ID is required');
        }
        return true;
    }),
    authMiddleWare.authUser,
    messagesController.sendMessage
);

module.exports = router;
