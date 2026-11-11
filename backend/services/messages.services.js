const Messages = require('../model/message.model');

const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 100;

module.exports.getMessages = async (myId, userToChatId, { limit, before } = {}) => {
    const filter = {
        $or: [
            { senderId: myId, receiverId: userToChatId },
            { senderId: userToChatId, receiverId: myId },
        ],
    };

    if (before) {
        const beforeDate = new Date(before);
        if (!Number.isNaN(beforeDate.getTime())) {
            filter.createdAt = { $lt: beforeDate };
        }
    }

    const parsedLimit = Math.min(
        Math.max(Number.parseInt(limit, 10) || DEFAULT_PAGE_LIMIT, 1),
        MAX_PAGE_LIMIT
    );

    const rows = await Messages.find(filter)
        .sort({ createdAt: -1 })
        .limit(parsedLimit + 1)
        .lean();

    const hasMore = rows.length > parsedLimit;
    const pageRows = hasMore ? rows.slice(0, parsedLimit) : rows;
    pageRows.reverse();

    return { messages: pageRows, hasMore };
};

module.exports.sendMessage = async (text, receiverId, myId, isEncrypted = false, iv = null) => {
    const newMessage = await Messages.create({
        senderId: myId,
        receiverId,
        text,
        isEncrypted: Boolean(isEncrypted),
        iv: iv || null
    });
    return newMessage;
};

module.exports.markMessagesSeen = async (myId, partnerId) => {
    const result = await Messages.updateMany(
        {
            senderId: partnerId,
            receiverId: myId,
            isSeen: { $ne: true }
        },
        { $set: { isSeen: true } }
    );
    return { modifiedCount: result.modifiedCount || 0 };
};
