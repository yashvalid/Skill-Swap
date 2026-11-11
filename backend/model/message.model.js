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

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, senderId: 1, createdAt: 1 });

const Messages = mongoose.model('message', messageSchema);

module.exports = Messages;
