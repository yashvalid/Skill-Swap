const mongoose = require('mongoose');
const SkillSwap = require('../model/skillSwap.model');
const User = require('../model/user.model');
const Messages = require('../model/message.model');
const { sendMessages, getReceiverSocketId } = require('../socket');

module.exports.requestSwap = async ({ fromUser, toUser, offersSkill, requestsSkill, scheduledTime, durationMinutes, proposalNotes }) => {
    try {
        const skillSwap = await SkillSwap.create({
            fromUser,
            toUser,
            offersSkill,
            requestsSkill,
            scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
            durationMinutes: durationMinutes ? Number(durationMinutes) : 30,
            proposalNotes: proposalNotes || ''
        });
        const toUserSocketId = getReceiverSocketId(toUser);
        const swapReq = await SkillSwap.findOne({ _id: skillSwap._id }).populate('fromUser');
        sendMessages(toUserSocketId, {
            event: 'swap-request',
            data: {
                swapReq
            },
        });
        return skillSwap;
    } catch (err) {
        console.error("Error creating skill swap request:", err);
        throw new Error("Error creating skill swap request");
    }
}

module.exports.acceptSwapRequest = async (requestId) => {
    try {
        const acceptSwap = await SkillSwap.findOneAndUpdate(
            { _id: requestId },
            { status: 'accepted' },
            { new: true }
        );
        const user = await User.findOne({ _id: acceptSwap.fromUser })
        sendMessages(user.socketId, {
            event: 'swap-accepted',
            data: user,
            swapId: acceptSwap._id,
        })
        return acceptSwap
    } catch (err) {
        throw new Error("Error accepting skill swap request");
    }
}

module.exports.completeSwap = async (requestId) => {
    try {
        const swap = await SkillSwap.findById(requestId);
        if (!swap) throw new Error("Swap not found");

        swap.status = 'completed';
        swap.completedAt = new Date();
        await swap.save();

        // Reward 1 credit to both users for completing an exchange
        await User.updateMany(
            { _id: { $in: [swap.fromUser, swap.toUser] } },
            {
                $inc: { credits: 1 },
                $set: { isVerified: true }
            }
        );

        return swap;
    } catch (err) {
        throw new Error("Error completing swap");
    }
}

module.exports.rejectSwap = async (requestId) => {
    try {
        const skillSwap = await SkillSwap.findById({ _id: requestId }).populate('fromUser');
        if (!skillSwap) {
            throw new Error("Skill swap request not found");
        }
        await SkillSwap.deleteOne({ _id: requestId });
        sendMessages(skillSwap.fromUser.socketId, skillSwap.fromUser);
        return skillSwap;
    } catch (err) {
        throw new Error("Error rejecting skill swap request");
    }
}

module.exports.rescheduleSwap = async ({ swapId, userId, scheduledTime, durationMinutes }) => {
    try {
        const swap = await SkillSwap.findById(swapId);
        if (!swap) throw new Error("Swap not found");

        // Verify user is a participant
        const isParticipant = swap.fromUser.toString() === userId.toString() || swap.toUser.toString() === userId.toString();
        if (!isParticipant) throw new Error("Unauthorized to reschedule this swap");

        swap.scheduledTime = new Date(scheduledTime);
        if (durationMinutes) swap.durationMinutes = Number(durationMinutes);
        await swap.save();

        // Notify other user via socket
        const otherUserId = swap.fromUser.toString() === userId.toString() ? swap.toUser : swap.fromUser;
        const otherSocketId = getReceiverSocketId(otherUserId);
        if (otherSocketId) {
            sendMessages(otherSocketId, {
                event: 'swap-rescheduled',
                data: {
                    swapId: swap._id,
                    scheduledTime: swap.scheduledTime,
                    durationMinutes: swap.durationMinutes
                }
            });
        }

        return swap;
    } catch (err) {
        console.error("Error in rescheduleSwap:", err);
        throw err;
    }
};

module.exports.getAllAcceptedSwaps = async (currUserId) => {
    try {
        if (!currUserId) throw new Error("No User ID provided");

        const swaps = await SkillSwap.find({
            status: { $in: ['accepted', 'completed'] },
            $or: [
                { fromUser: currUserId },
                { toUser: currUserId }
            ]
        })
            .populate('fromUser')
            .populate('toUser')
            .lean();

        const otherUsers = swaps
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
                    createdAt: swap.createdAt
                };
            })
            .filter(item => item !== null);

        const uniqueUsers = Array.from(
            new Map(
                otherUsers.map(entry => [entry.otherUser._id.toString(), entry])
            ).values()
        );

        if (uniqueUsers.length > 0) {
            const userObjIds = uniqueUsers.map(u => new mongoose.Types.ObjectId(u.otherUser._id));
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
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $project: {
                        text: 1,
                        isEncrypted: 1,
                        iv: 1,
                        messageType: 1,
                        senderId: 1,
                        receiverId: 1,
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
                        lastMessage: { $first: "$$ROOT" }
                    }
                }
            ]);

            const lastMessageMap = new Map(
                lastMessages.map(item => [item._id.toString(), item.lastMessage])
            );

            uniqueUsers.forEach(entry => {
                const partnerId = entry.otherUser._id.toString();
                const msg = lastMessageMap.get(partnerId);
                if (msg) {
                    entry.lastMessage = {
                        text: msg.text,
                        senderId: msg.senderId,
                        receiverId: msg.receiverId,
                        createdAt: msg.createdAt
                    };
                    entry.lastMessageAt = new Date(msg.createdAt).getTime();
                } else {
                    entry.lastMessage = null;
                    entry.lastMessageAt = 0;
                }
            });

            // Order recipients: whoever has sent the most recent message comes first
            uniqueUsers.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
        }

        return uniqueUsers;
    } catch (err) {
        console.error("Error in getAllAcceptedSwaps:", err);
        throw err;
    }
};

module.exports.getPendingSwaps = async (userId) => {
    try {
        const pendingSwaps = await SkillSwap.find({ toUser: userId, status: 'pending' })
            .populate('fromUser')
            .lean();
        return pendingSwaps;
    } catch (err) {
        throw new Error(err);
    }
}
