const mongoose = require('mongoose');

const skillSwapSchema = new mongoose.Schema({
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    toUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    offersSkill: {
        type: String,
        required: true
    },
    requestsSkill: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed'],
        default: 'pending'
    },
    milestones: [{
        title: { type: String, required: true },
        completed: { type: Boolean, default: false }
    }],
    scheduledTime: {
        type: Date
    },
    durationMinutes: {
        type: Number,
        default: 30
    },
    proposalNotes: {
        type: String,
        default: ''
    },
    sessionNotes: {
        type: String,
        default: ''
    },
    completedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const SkillSwap = mongoose.model('skillSwap', skillSwapSchema);

module.exports = SkillSwap;
