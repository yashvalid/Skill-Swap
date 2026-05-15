const { validationResult } = require('express-validator');
const messagesService = require('../services/messages.services');
const { getReceiverSocketId, sendMessages } = require('../socket');
const { invalidateCache } = require('../middlewares/cache');

module.exports.getMessages = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(404).json({ error: errors });

    const { userToChatId } = req.query;
    try {
        const messages = await messagesService.getMessages(req.user._id, userToChatId);
        return res.status(201).json({ messages: messages });
    } catch (err) {
        return res.status(500).json({ error: "internal server error" });
    }
}

module.exports.sendMessage = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(404).json({ error: errors });

    const { text, receiverId } = req.body;
    try {
        const messages = await messagesService.sendMessage(text, receiverId, req.user._id);
        const receiverSocketID = await getReceiverSocketId(receiverId);
        if (receiverSocketID)
            await sendMessages(receiverSocketID, message = {
                event: 'new-message',
                data: messages
            });

        // Invalidate message caches for both sender and receiver
        await invalidateCache([
            `cache:messages:${req.user._id}:${receiverId}`,
            `cache:messages:${receiverId}:${req.user._id}`
        ]);

        return res.status(201).json({messages});
    } catch(err){
        return res.status(500).json({error : 'internal server error'});
    }
}