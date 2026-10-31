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
        required : true,
    },
    messageType: {
        type: String,
        enum: ['text', 'call'],
        default: 'text'
    },
    isEncrypted: {
        type: Boolean,
        default: false
    },
    iv: {
        type: String,
        default: null
    },
    callDetails: {
        status: {
            type: String,
            enum: ['completed', 'missed', 'declined', 'cancelled'],
            default: 'completed'
        },
        duration: {
            type: Number,
            default: 0
        }
    },
    isSeen : {
        type : Boolean,
        default : false
    }
}, { timestamps : true });

const Messages = mongoose.model('message', messageSchema);

module.exports = Messages;
