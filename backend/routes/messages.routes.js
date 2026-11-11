const express = require('express');
const router = express.Router();
const authMiddleWare = require('../middlewares/authentication');
const { query, body } = require('express-validator');
const messagesController = require('../controllers/messages.controllers');
const { cache } = require('../middlewares/cache');

router.get('/get-messages',
    authMiddleWare.authUser,
    query('userToChatId').notEmpty().withMessage('UserToChatId is required'),
    cache(300, (req) => `cache:messages:${req.user._id}:${req.query.userToChatId}:l=${req.query.limit || 50}:b=${req.query.before || ''}`),
    messagesController.getMessages
);

router.post('/send-message',
    authMiddleWare.authUser,
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
    messagesController.sendMessage
);

router.patch('/mark-seen',
    authMiddleWare.authUser,
    messagesController.markSeen
);

module.exports = router;
