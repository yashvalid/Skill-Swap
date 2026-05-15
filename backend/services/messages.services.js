const Messages = require('../model/message.model');
const {getReceiverSocketId} = require('../socket');

module.exports.getMessages = async (myId, userToChatId) =>{
    try{
        const messages = await Messages.find({
            $or : [
                {senderId : myId, receiverId : userToChatId},
                {senderId : userToChatId, receiverId : myId},
            ],
        });
        return messages;
    } catch(err){
        throw new Error('Internal server error');
    }
}

module.exports.sendMessage = async (text, receiverId, myId) => {
    try{
        const newMessage = await Messages.create({
            senderId : myId,
            receiverId,
            text
        })
        return newMessage;
    } catch(err){
        throw new Error('error is sending message');
    }
}