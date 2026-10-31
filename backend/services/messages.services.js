const Messages = require('../model/message.model');
const { getReceiverSocketId } = require('../socket');

module.exports.getMessages = async (myId, userToChatId) => {
    try {
        const messages = await Messages.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        }).sort({ createdAt: 1 });
        return messages;
    } catch (err) {
        throw new Error('Internal server error');
    }
};

module.exports.sendMessage = async (text, receiverId, myId, isEncrypted = false, iv = null) => {
    try {
        const newMessage = await Messages.create({
            senderId: myId,
            receiverId,
            text,
            isEncrypted: Boolean(isEncrypted),
            iv: iv || null
        });
        return newMessage;
    } catch (err) {
        throw new Error('error is sending message');
    }
};
