const SkillSwap = require('../model/skillSwap.model');
const User = require('../model/user.model');
const { sendMessages, getReceiverSocketId } = require('../socket');

module.exports.requestSwap = async ({ fromUser, toUser, offersSkill, requestsSkill }) => {
    try {
        const skillSwap = await SkillSwap.create({
            fromUser,
            toUser,
            offersSkill,
            requestsSkill
        });
        const toUserSocketId = getReceiverSocketId(toUser);
        // const fromUserData = await User.findOne({ _id: fromUser })
        const swapReq = await SkillSwap.findOne({ _id: skillSwap._id }).populate('fromUser');
        sendMessages(toUserSocketId, {
            event: 'swap-request',
            data: {
                swapReq
            },
        });
        return skillSwap;
    } catch (err) {
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
        sendMessages(user.socketId, message = {
            event: 'swap-accepted',
            data: user,
            swapId: acceptSwap._id,
        })
        return acceptSwap
    } catch (err) {
        throw new Error("Error accepting skill swap request");
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

module.exports.getAllAcceptedSwaps = async (currUserId) => {
    try {
        if (!currUserId) throw new Error("No User ID provided");

        const swaps = await SkillSwap.find({
            status: 'accepted',
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
                    otherUser,
                    requestedSkill: isFrom ? swap.requestsSkill : swap.offersSkill,
                    skillOffered: isFrom ? swap.offersSkill : swap.requestsSkill
                };
            })
            .filter(item => item !== null);


        const uniqueUsers = Array.from(
            new Map(
                otherUsers.map(entry => [entry.otherUser._id.toString(), entry])
            ).values()
        );

        return uniqueUsers;
    } catch (err) {
        console.error("Error in getAllAcceptedSwaps:", err);
        throw err;
    }
};

module.exports.getPendingSwaps = async (userId) => {
    try {
        const pendindSwaps = await SkillSwap.find({ toUser: userId, status: 'pending' }).populate('fromUser');
        return pendindSwaps;
    } catch (err) {
        throw new Error(err);
    }
}