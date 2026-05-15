const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user',
        required : true,
    },
    receiverId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user',
        required : true,
    },
    text : {
        type : String,
    },
    isSeen : {
        type : Boolean,
        default : false
    }
}, {timestamps : true});

const Messages = mongoose.model('message', messageSchema);

module.exports = Messages;