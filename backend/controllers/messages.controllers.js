const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const User = require('../model/user.model');
const messagesService = require('../services/messages.services');
const { emitToUser } = require('../socket');
const { invalidateCache } = require('../middlewares/cache');

module.exports.getMessages = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { userToChatId, limit, before } = req.query;
    if (!mongoose.isValidObjectId(userToChatId)) {
        return res.status(400).json({ message: 'Invalid userToChatId' });
    }
    if (before && Number.isNaN(new Date(before).getTime())) {
        return res.status(400).json({ message: 'Invalid before cursor timestamp' });
    }

    try {
        const result = await messagesService.getMessages(req.user._id, userToChatId, { limit, before });
        return res.status(200).json({
            messages: result?.messages || [],
            hasMore: Boolean(result?.hasMore)
        });
    } catch {
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
            `cache:messages:${req.user._id}:${receiverId}*`,
            `cache:messages:${receiverId}:${req.user._id}*`,
            `cache:swaps:accepted:${req.user._id}`,
            `cache:swaps:accepted:${receiverId}`
        ]);

        return res.status(200).json({ messages });
    } catch {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports.markSeen = async (req, res) => {
    const partnerId = req.body.partnerId || req.body.userId;
    if (!partnerId || !mongoose.isValidObjectId(partnerId)) {
        return res.status(400).json({ message: 'Valid partnerId is required' });
    }
    if (partnerId.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'Cannot mark messages with yourself' });
    }

    try {
        const { modifiedCount } = await messagesService.markMessagesSeen(req.user._id, partnerId);

        if (modifiedCount > 0) {
            await emitToUser(partnerId, 'messages-seen', {
                by: req.user._id.toString(),
                seenAt: new Date().toISOString()
            });

            await invalidateCache([
                `cache:messages:${req.user._id}:${partnerId}*`,
                `cache:messages:${partnerId}:${req.user._id}*`,
                `cache:swaps:accepted:${req.user._id}`,
                `cache:swaps:accepted:${partnerId}`
            ]);
        }

        return res.status(200).json({ updated: modifiedCount });
    } catch {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
