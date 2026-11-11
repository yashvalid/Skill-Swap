const mongoose = require('mongoose');
const skillSwapService = require('../services/skillSwap.services');
const { validationResult } = require('express-validator');
const { invalidateCache } = require('../middlewares/cache');

const handleServiceError = (res, err, fallbackMsg) => {
    const status = err.status || 500;
    if (status >= 500) {
        console.error(fallbackMsg, err);
    }
    return res.status(status).json({ message: status < 500 ? err.message : fallbackMsg });
};

module.exports.requestSwap = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const fromUser = req.user._id;
    const toUser = req.body.toUser || req.body.toUserId;
    const offersSkill = req.body.offersSkill || req.body.skillOffered;
    const requestsSkill = req.body.requestsSkill || req.body.skillRequested;
    const scheduledTime = req.body.scheduledTime || null;
    const rawDuration = req.body.durationMinutes ? Number(req.body.durationMinutes) : 30;
    const durationMinutes = Number.isFinite(rawDuration) ? Math.min(180, Math.max(15, rawDuration)) : 30;
    const proposalNotes = typeof req.body.proposalNotes === 'string' ? req.body.proposalNotes.trim().slice(0, 1000) : '';

    if (!mongoose.isValidObjectId(toUser)) {
        return res.status(400).json({ message: "Invalid recipient user ID" });
    }
    if (toUser.toString() === fromUser.toString()) {
        return res.status(400).json({ message: "You cannot propose a swap with yourself" });
    }
    if (scheduledTime && Number.isNaN(new Date(scheduledTime).getTime())) {
        return res.status(400).json({ message: "Invalid scheduledTime" });
    }

    try {
        const skillSwap = await skillSwapService.requestSwap({
            fromUser,
            toUser,
            offersSkill: offersSkill.trim(),
            requestsSkill: requestsSkill.trim(),
            scheduledTime,
            durationMinutes,
            proposalNotes
        });

        await invalidateCache(`cache:swaps:pending:${toUser}`);
        return res.status(201).json({ message: "Skill swap request created successfully", skillSwap });
    } catch (err) {
        return handleServiceError(res, err, "Internal server error");
    }
};

module.exports.acceptSwapRequest = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const { requestId } = req.query;
    if (!mongoose.isValidObjectId(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
    }

    try {
        const skillSwap = await skillSwapService.acceptSwapRequest(requestId, req.user._id);

        await invalidateCache([
            `cache:swaps:accepted:${skillSwap.fromUser}`,
            `cache:swaps:accepted:${skillSwap.toUser}`,
            `cache:swaps:pending:${skillSwap.fromUser}`,
            `cache:swaps:pending:${skillSwap.toUser}`
        ]);

        return res.status(200).json({ message: "Skill swap request accepted successfully", skillSwap });
    } catch (err) {
        return handleServiceError(res, err, "Internal server error");
    }
};

module.exports.completeSwap = async (req, res) => {
    const { requestId } = req.body;
    if (!requestId || !mongoose.isValidObjectId(requestId)) {
        return res.status(400).json({ message: "Valid Request ID is required" });
    }

    try {
        const skillSwap = await skillSwapService.completeSwap(requestId, req.user._id);

        await invalidateCache([
            `cache:swaps:accepted:${skillSwap.fromUser}`,
            `cache:swaps:accepted:${skillSwap.toUser}`
        ]);

        return res.status(200).json({ message: "Skill swap completed successfully", skillSwap });
    } catch (err) {
        return handleServiceError(res, err, "Internal server error");
    }
};

module.exports.rejectSwap = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const { requestId } = req.query;
    if (!mongoose.isValidObjectId(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
    }

    try {
        const skillSwap = await skillSwapService.rejectSwap(requestId, req.user._id);
        const fromUserId = skillSwap.fromUser?._id || skillSwap.fromUser;
        const toUserId = skillSwap.toUser?._id || skillSwap.toUser;

        await invalidateCache([
            `cache:swaps:pending:${fromUserId}`,
            `cache:swaps:pending:${toUserId}`
        ]);

        return res.status(200).json({ message: "Skill swap request rejected successfully", skillSwap });
    } catch (err) {
        return handleServiceError(res, err, "Internal server error");
    }
};

module.exports.rescheduleSwap = async (req, res) => {
    const { swapId, scheduledTime, durationMinutes } = req.body;
    if (!swapId || !scheduledTime || !mongoose.isValidObjectId(swapId)) {
        return res.status(400).json({ message: "Valid Swap ID and scheduled time are required" });
    }
    if (Number.isNaN(new Date(scheduledTime).getTime())) {
        return res.status(400).json({ message: "Invalid scheduledTime" });
    }

    try {
        const updatedSwap = await skillSwapService.rescheduleSwap({
            swapId,
            userId: req.user._id,
            scheduledTime,
            durationMinutes: durationMinutes ? Number(durationMinutes) : 30
        });

        await invalidateCache([
            `cache:swaps:accepted:${updatedSwap.fromUser}`,
            `cache:swaps:accepted:${updatedSwap.toUser}`
        ]);

        return res.status(200).json({ message: "Session rescheduled successfully", skillSwap: updatedSwap });
    } catch (err) {
        return handleServiceError(res, err, "Failed to reschedule session");
    }
};

module.exports.getAllAcceptedSwaps = async (req, res) => {
    try {
        const allUsers = await skillSwapService.getAllAcceptedSwaps(req.user._id);
        return res.status(200).json({ allUsers });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.getPendingSwaps = async (req, res) => {
    try {
        const pendingSwaps = await skillSwapService.getPendingSwaps(req.user._id);
        return res.status(200).json({ pendingSwaps });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.updateSwapWorkspace = async (req, res) => {
    const { swapId, milestones, sessionNotes } = req.body;
    if (!swapId || !mongoose.isValidObjectId(swapId)) {
        return res.status(400).json({ message: "Valid Swap ID is required" });
    }

    try {
        const updatedSwap = await skillSwapService.updateSwapWorkspace({
            swapId,
            userId: req.user._id,
            milestones,
            sessionNotes
        });

        await invalidateCache([
            `cache:swaps:accepted:${updatedSwap.fromUser}`,
            `cache:swaps:accepted:${updatedSwap.toUser}`
        ]);

        return res.status(200).json({ message: "Session workspace updated successfully", skillSwap: updatedSwap });
    } catch (err) {
        return handleServiceError(res, err, "Failed to update workspace");
    }
};
