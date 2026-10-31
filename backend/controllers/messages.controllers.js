const { validationResult } = require('express-validator');
const messagesService = require('../services/messages.services');
const { getReceiverSocketId, sendMessages } = require('../socket');
const { invalidateCache } = require('../middlewares/cache');

module.exports.getMessages = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { userToChatId } = req.query;
    try {
        const messages = await messagesService.getMessages(req.user._id, userToChatId);
        return res.status(200).json({ messages: messages || [] });
    } catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.sendMessage = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const text = req.body.text || req.body.message || req.body.content;
    const receiverId = req.body.receiverId || req.body.to || req.body.receiver;

    try {
        const messages = await messagesService.sendMessage(text, receiverId, req.user._id);
        const receiverSocketID = await getReceiverSocketId(receiverId);
        if (receiverSocketID) {
            await sendMessages(receiverSocketID, {
                event: 'new-message',
                data: messages
            });
        }

        // Invalidate message & swap caches for both sender and receiver
        await invalidateCache([
            `cache:messages:${req.user._id}:${receiverId}`,
            `cache:messages:${receiverId}:${req.user._id}`,
            `cache:swaps:accepted:${req.user._id}`,
            `cache:swaps:accepted:${receiverId}`
        ]);

        return res.status(200).json({ messages });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
