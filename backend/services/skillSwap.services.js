const mongoose = require('mongoose');
const SkillSwap = require('../model/skillSwap.model');
const User = require('../model/user.model');
const Messages = require('../model/message.model');
const { emitToUser } = require('../socket');

const SAFE_PARTNER_PROJECTION = 'fullname role location bio skillsOffered skillsNeeded averageRating totalRatings isVerified publicKey credits';

const httpError = (status, message) => {
    const err = new Error(message);
    err.status = status;
    return err;
};

module.exports.requestSwap = async ({ fromUser, toUser, offersSkill, requestsSkill, scheduledTime, durationMinutes, proposalNotes }) => {
    const recipient = await User.findById(toUser).select('_id');
    if (!recipient) {
        throw httpError(404, "Target user not found");
    }

    const skillSwap = await SkillSwap.create({
        fromUser,
        toUser,
        offersSkill,
        requestsSkill,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        durationMinutes: durationMinutes ? Number(durationMinutes) : 30,
        proposalNotes: proposalNotes || ''
    });

    const swapReq = await SkillSwap.findById(skillSwap._id)
        .populate('fromUser', SAFE_PARTNER_PROJECTION)
        .lean();
    await emitToUser(toUser, 'swap-request', swapReq || skillSwap);

    return skillSwap;
};

module.exports.acceptSwapRequest = async (requestId, userId) => {
    const existing = await SkillSwap.findById(requestId);
    if (!existing) throw httpError(404, "Skill swap request not found");
    if (existing.toUser.toString() !== userId.toString()) {
        throw httpError(403, "Only the swap recipient can accept this request");
    }
    if (existing.status !== 'pending') {
        throw httpError(400, `Cannot accept a swap with status '${existing.status}'`);
    }

    const acceptSwap = await SkillSwap.findOneAndUpdate(
        { _id: requestId, toUser: userId, status: 'pending' },
        { status: 'accepted' },
        { new: true }
    );
    if (!acceptSwap) throw httpError(409, "Swap request already updated");

    await emitToUser(acceptSwap.fromUser, 'swap-accepted', {
        swapId: acceptSwap._id,
        toUser: acceptSwap.toUser
    });

    return acceptSwap;
};

module.exports.completeSwap = async (requestId, userId) => {
    const existing = await SkillSwap.findById(requestId);
    if (!existing) throw httpError(404, "Swap not found");

    const isParticipant =
        existing.fromUser.toString() === userId.toString() ||
        existing.toUser.toString() === userId.toString();
    if (!isParticipant) {
        throw httpError(403, "Unauthorized to complete this swap");
    }
    if (existing.status !== 'accepted') {
        throw httpError(400, existing.status === 'completed'
            ? "Swap is already completed"
            : "Only accepted swaps can be completed");
    }

    // Conditional atomic transition prevents duplicate credit rewards under concurrent requests
    const swap = await SkillSwap.findOneAndUpdate(
        {
            _id: requestId,
            status: 'accepted',
            $or: [{ fromUser: userId }, { toUser: userId }]
        },
        {
            $set: { status: 'completed', completedAt: new Date() }
        },
        { new: true }
    );

    if (!swap) {
        throw httpError(409, "Swap status changed concurrently");
    }

    await User.updateMany(
        { _id: { $in: [swap.fromUser, swap.toUser] } },
        {
            $inc: { credits: 1 },
            $set: { isVerified: true }
        }
    );

    const otherUserId = swap.fromUser.toString() === userId.toString() ? swap.toUser : swap.fromUser;
    await emitToUser(otherUserId, 'swap-completed', {
        swapId: swap._id,
        completedAt: swap.completedAt
    });

    return swap;
};

module.exports.rejectSwap = async (requestId, userId) => {
    const skillSwap = await SkillSwap.findById(requestId);
    if (!skillSwap) {
        throw httpError(404, "Skill swap request not found");
    }

    const isParticipant =
        skillSwap.fromUser.toString() === userId.toString() ||
        skillSwap.toUser.toString() === userId.toString();
    if (!isParticipant) {
        throw httpError(403, "Unauthorized to reject this swap");
    }
    if (skillSwap.status !== 'pending') {
        throw httpError(400, "Only pending swap requests can be rejected");
    }

    await SkillSwap.deleteOne({ _id: requestId, status: 'pending' });

    const otherUserId = skillSwap.fromUser.toString() === userId.toString()
        ? skillSwap.toUser
        : skillSwap.fromUser;
    await emitToUser(otherUserId, 'swap-rejected', { swapId: skillSwap._id });

    return skillSwap;
};

module.exports.rescheduleSwap = async ({ swapId, userId, scheduledTime, durationMinutes }) => {
    const swap = await SkillSwap.findById(swapId);
    if (!swap) throw httpError(404, "Swap not found");

    const isParticipant = swap.fromUser.toString() === userId.toString() || swap.toUser.toString() === userId.toString();
    if (!isParticipant) throw httpError(403, "Unauthorized to reschedule this swap");

    swap.scheduledTime = new Date(scheduledTime);
    if (durationMinutes) {
        const parsed = Number(durationMinutes);
        if (Number.isFinite(parsed) && parsed >= 15 && parsed <= 180) {
            swap.durationMinutes = parsed;
        }
    }
    await swap.save();

    const otherUserId = swap.fromUser.toString() === userId.toString() ? swap.toUser : swap.fromUser;
    await emitToUser(otherUserId, 'swap-rescheduled', {
        swapId: swap._id,
        scheduledTime: swap.scheduledTime,
        durationMinutes: swap.durationMinutes
    });

    return swap;
};

module.exports.getAllAcceptedSwaps = async (currUserId) => {
    if (!currUserId) throw httpError(400, "No User ID provided");

    const swaps = await SkillSwap.find({
        status: { $in: ['accepted', 'completed'] },
        $or: [
            { fromUser: currUserId },
            { toUser: currUserId }
        ]
    })
        .populate('fromUser', SAFE_PARTNER_PROJECTION)
        .populate('toUser', SAFE_PARTNER_PROJECTION)
        .sort({ createdAt: -1 })
        .lean();

    const entries = swaps
        .map(swap => {
            if (!swap.fromUser || !swap.toUser) return null;

            const isFrom = swap.fromUser._id.toString() === currUserId.toString();
            const otherUser = isFrom ? swap.toUser : swap.fromUser;

            return {
                swapId: swap._id,
                status: swap.status,
                otherUser,
                requestedSkill: isFrom ? swap.requestsSkill : swap.offersSkill,
                skillOffered: isFrom ? swap.offersSkill : swap.requestsSkill,
                scheduledTime: swap.scheduledTime || null,
                durationMinutes: swap.durationMinutes || 30,
                proposalNotes: swap.proposalNotes || '',
                milestones: swap.milestones || [],
                sessionNotes: swap.sessionNotes || '',
                createdAt: swap.createdAt
            };
        })
        .filter(item => item !== null);

    // Keep accepted swaps before completed ones when ordering
    entries.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'accepted' ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (entries.length > 0) {
        const uniquePartnerIds = Array.from(new Set(entries.map(u => u.otherUser._id.toString())));
        const userObjIds = uniquePartnerIds.map(id => new mongoose.Types.ObjectId(id));
        const currUserObjId = new mongoose.Types.ObjectId(currUserId);

        const lastMessages = await Messages.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: currUserObjId, receiverId: { $in: userObjIds } },
                        { receiverId: currUserObjId, senderId: { $in: userObjIds } }
                    ]
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    text: 1,
                    isEncrypted: 1,
                    iv: 1,
                    messageType: 1,
                    senderId: 1,
                    receiverId: 1,
                    isSeen: 1,
                    createdAt: 1,
                    partnerId: {
                        $cond: [
                            { $eq: ["$senderId", currUserObjId] },
                            "$receiverId",
                            "$senderId"
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: "$partnerId",
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$receiverId", currUserObjId] },
                                        { $ne: ["$isSeen", true] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const conversationMap = new Map(
            lastMessages.map(item => [item._id.toString(), item])
        );

        entries.forEach(entry => {
            const partnerId = entry.otherUser._id.toString();
            const conv = conversationMap.get(partnerId);
            const msg = conv?.lastMessage;
            entry.unreadCount = conv?.unreadCount || 0;
            if (msg) {
                entry.lastMessage = {
                    text: msg.text,
                    isEncrypted: msg.isEncrypted,
                    iv: msg.iv,
                    messageType: msg.messageType,
                    senderId: msg.senderId,
                    receiverId: msg.receiverId,
                    isSeen: Boolean(msg.isSeen),
                    createdAt: msg.createdAt
                };
                entry.lastMessageAt = new Date(msg.createdAt).getTime();
            } else {
                entry.lastMessage = null;
                entry.lastMessageAt = 0;
            }
        });

        entries.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    }

    return entries;
};

module.exports.getPendingSwaps = async (userId) => {
    const pendingSwaps = await SkillSwap.find({ toUser: userId, status: 'pending' })
        .populate('fromUser', SAFE_PARTNER_PROJECTION)
        .sort({ createdAt: -1 })
        .lean();
    return pendingSwaps;
};

module.exports.updateSwapWorkspace = async ({ swapId, userId, milestones, sessionNotes }) => {
    const swap = await SkillSwap.findById(swapId);
    if (!swap) throw httpError(404, "Skill swap record not found");

    const isParticipant = swap.fromUser.toString() === userId.toString() || swap.toUser.toString() === userId.toString();
    if (!isParticipant) throw httpError(403, "Unauthorized to update workspace for this swap");

    if (Array.isArray(milestones)) {
        swap.milestones = milestones
            .filter(m => m && typeof m.title === 'string' && m.title.trim())
            .map(m => ({ title: m.title.trim().slice(0, 200), completed: Boolean(m.completed) }));
    }
    if (typeof sessionNotes === 'string') {
        swap.sessionNotes = sessionNotes.slice(0, 20000);
    }

    await swap.save();
    return swap;
};
