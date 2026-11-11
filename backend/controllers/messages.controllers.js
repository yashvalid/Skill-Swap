const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const User = require('../model/user.model');
const messagesService = require('../services/messages.services');
const { emitToUser } = require('../socket');
const { invalidateCache } = require('../middlewares/cache');

module.exports.getMessages = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { userToChatId } = req.query;
    if (!mongoose.isValidObjectId(userToChatId)) {
        return res.status(400).json({ message: 'Invalid userToChatId' });
    }

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

    const rawText = req.body.text || req.body.message || req.body.content;
    const text = typeof rawText === 'string' ? rawText.trim().slice(0, 10000) : '';
    const receiverId = req.body.receiverId || req.body.to || req.body.receiver;
    const isEncrypted = Boolean(req.body.isEncrypted);
    const iv = req.body.iv || null;

    if (!text) {
        return res.status(400).json({ message: 'Message text cannot be empty' });
    }
    if (!mongoose.isValidObjectId(receiverId)) {
        return res.status(400).json({ message: 'Invalid receiverId' });
    }
    if (receiverId.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    try {
        const receiver = await User.findById(receiverId).select('_id');
        if (!receiver) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        const messages = await messagesService.sendMessage(text, receiverId, req.user._id, isEncrypted, iv);
        await emitToUser(receiverId, 'new-message', messages);

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
