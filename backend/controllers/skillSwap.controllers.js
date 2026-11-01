const skillSwapService = require('../services/skillSwap.services');
const { validationResult } = require('express-validator');
const { getReceiverSocketId, sendMessages } = require('../socket');
const { invalidateCache } = require('../middlewares/cache');

module.exports.requestSwap = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const fromUser = req.body.fromUser || req.user?._id;
    const toUser = req.body.toUser || req.body.toUserId;
    const offersSkill = req.body.offersSkill || req.body.skillOffered;
    const requestsSkill = req.body.requestsSkill || req.body.skillRequested;
    const scheduledTime = req.body.scheduledTime || null;
    const durationMinutes = req.body.durationMinutes ? Number(req.body.durationMinutes) : 30;
    const proposalNotes = req.body.proposalNotes || '';

    try {
        const skillSwap = await skillSwapService.requestSwap({
            fromUser,
            toUser,
            offersSkill,
            requestsSkill,
            scheduledTime,
            durationMinutes,
            proposalNotes
        });

        const receiverSocketId = await getReceiverSocketId(toUser);
        if (receiverSocketId) {
            await sendMessages(receiverSocketId, {
                event: 'swap-request',
                data: skillSwap
            });
        }

        // Invalidate pending swaps for the receiver
        await invalidateCache(`cache:swaps:pending:${toUser}`);

        return res.status(201).json({ message: "Skill swap request created successfully", skillSwap });
    } catch (err) {
        console.error("Error creating swap request:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.acceptSwapRequest = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });
    const { requestId } = req.query;

    try {
        const skillSwap = await skillSwapService.acceptSwapRequest(requestId);

        // Invalidate accepted and pending swaps for both users
        await invalidateCache([
            `cache:swaps:accepted:${skillSwap.fromUser}`,
            `cache:swaps:accepted:${skillSwap.toUser}`,
            `cache:swaps:pending:${skillSwap.fromUser}`,
            `cache:swaps:pending:${skillSwap.toUser}`
        ]);

        return res.status(200).json({ message: "Skill swap request accepted successfully", skillSwap });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.completeSwap = async (req, res) => {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ message: "Request ID is required" });

    try {
        const skillSwap = await skillSwapService.completeSwap(requestId);

        // Invalidate cache for accepted swaps
        await invalidateCache([
            `cache:swaps:accepted:${skillSwap.fromUser}`,
            `cache:swaps:accepted:${skillSwap.toUser}`
        ]);

        return res.status(200).json({ message: "Skill swap completed successfully", skillSwap });
    } catch (err) {
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
}

module.exports.rejectSwap = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });
    const { requestId } = req.query;
    try {
        const skillSwap = await skillSwapService.rejectSwap(requestId);
        
        await invalidateCache([
            `cache:swaps:pending:${skillSwap.fromUser}`,
            `cache:swaps:pending:${skillSwap.toUser}`
        ]);

        return res.status(200).json({ message: "Skill swap request rejected successfully", skillSwap });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.rescheduleSwap = async (req, res) => {
    const { swapId, scheduledTime, durationMinutes } = req.body;
    if (!swapId || !scheduledTime) {
        return res.status(400).json({ message: "Swap ID and scheduled time are required" });
    }

    try {
        const updatedSwap = await skillSwapService.rescheduleSwap({
            swapId,
            userId: req.user._id,
            scheduledTime,
            durationMinutes: durationMinutes ? Number(durationMinutes) : 30
        });

        // Invalidate cache for both users
        await invalidateCache([
            `cache:swaps:accepted:${updatedSwap.fromUser}`,
            `cache:swaps:accepted:${updatedSwap.toUser}`
        ]);

        return res.status(200).json({ message: "Session rescheduled successfully", skillSwap: updatedSwap });
    } catch (err) {
        console.error("Error rescheduling swap:", err);
        return res.status(500).json({ message: err.message || "Failed to reschedule session" });
    }
};

module.exports.getAllAcceptedSwaps = async (req, res) => {
    try {
        const allUsers = await skillSwapService.getAllAcceptedSwaps(req.user._id);
        return res.status(200).json({ allUsers });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.getPendingSwaps = async (req, res) => {
    try {
        const pendingSwaps = await skillSwapService.getPendingSwaps(req.user._id);
        return res.status(200).json({ pendingSwaps });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}
