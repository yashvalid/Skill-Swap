const socket = require('socket.io');
const User = require('./model/user.model');
const SkillSwap = require('./model/skillSwap.model');
const Messages = require('./model/message.model');
const redisClient = require('./services/redis.service');
const { invalidateCache } = require('./middlewares/cache');

let io;

// Track active calls in memory: callKey -> { callerId, receiverId, status, connectedAt, startedRingingAt }
const activeCalls = new Map();

const getCallKey = (user1, user2) => {
    return [user1.toString(), user2.toString()].sort().join('_');
};

const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const isSocketAlive = (socketId) => {
    if (!io || !socketId) return false;
    return Boolean(io.sockets.sockets.get(socketId));
};

const isUserInCall = (userId) => {
    if (!userId) return false;
    const uid = userId.toString();
    const now = Date.now();
    for (const [key, call] of activeCalls.entries()) {
        if (call.status === 'ringing' && call.startedRingingAt && (now - call.startedRingingAt > 45000)) {
            activeCalls.delete(key);
            continue;
        }
        if (call.status === 'ongoing' && call.connectedAt && (now - call.connectedAt > 3 * 3600 * 1000)) {
            activeCalls.delete(key);
            continue;
        }
        const callerMatch = call.callerId && call.callerId.toString() === uid;
        const receiverMatch = call.receiverId && call.receiverId.toString() === uid;
        if ((callerMatch || receiverMatch) && (call.status === 'ongoing' || call.status === 'ringing')) {
            return true;
        }
    }
    return false;
};

const logCallRecord = async ({ callerId, receiverId, status, duration = 0 }) => {
    try {
        if (!callerId || !receiverId) return null;
        const cId = callerId.toString();
        const rId = receiverId.toString();

        // Guard against corrupted identical participant IDs
        if (cId === rId) {
            console.warn('[Socket] Blocked attempt to log call record with identical caller and receiver:', cId);
            return null;
        }

        // Deduplication: prevent duplicate call logs within 5 seconds for same pair
        const recentLog = await Messages.findOne({
            messageType: 'call',
            $or: [
                { senderId: cId, receiverId: rId },
                { senderId: rId, receiverId: cId }
            ],
            createdAt: { $gte: new Date(Date.now() - 5000) }
        });
        if (recentLog) {
            return recentLog;
        }

        let text = '📹 Video Sync';
        if (status === 'completed') {
            text = `📹 Video Sync ended • ${formatCallDuration(duration)}`;
        } else if (status === 'missed') {
            text = '📞 Missed Video Call';
        } else if (status === 'declined') {
            text = '📞 Declined Video Call';
        } else if (status === 'cancelled') {
            text = '📞 Cancelled Video Call';
        }

        const message = await Messages.create({
            senderId: cId,
            receiverId: rId,
            text,
            messageType: 'call',
            callDetails: {
                status,
                duration
            }
        });

        // Broadcast real-time call log message to both caller and receiver sockets
        const callerSocketId = await getReceiverSocketId(cId);
        const receiverSocketId = await getReceiverSocketId(rId);

        if (callerSocketId) {
            io.to(callerSocketId).emit('new-message', message);
        }
        if (receiverSocketId && receiverSocketId !== callerSocketId) {
            io.to(receiverSocketId).emit('new-message', message);
        }

        // Invalidate message and swap partner cache keys
        await invalidateCache([
            `cache:messages:${cId}:${rId}`,
            `cache:messages:${rId}:${cId}`,
            `cache:swaps:accepted:${cId}`,
            `cache:swaps:accepted:${rId}`
        ]);

        return message;
    } catch (err) {
        console.warn('[Socket] Failed to log call record message:', err.message);
        return null;
    }
};

const getReceiverSocketId = async (receiverId) => {
    if (!receiverId) return null;
    let candidateSocketId = null;

    try {
        candidateSocketId = await redisClient.get(receiverId);
    } catch (err) {
        console.warn('[Socket] Redis lookup error:', err.message);
    }

    // Verify candidate socket is ACTUALLY connected right now
    if (candidateSocketId && isSocketAlive(candidateSocketId)) {
        return candidateSocketId;
    }

    try {
        const user = await User.findById(receiverId).select('socketId');
        if (user?.socketId && isSocketAlive(user.socketId)) {
            await redisClient.set(receiverId, user.socketId, { EX: 24 * 60 * 60 });
            return user.socketId;
        }
    } catch (err) { }

    // Clean up stale entries if offline
    try {
        if (candidateSocketId) {
            await redisClient.del(receiverId);
            await redisClient.del(candidateSocketId);
        }
    } catch (e) { }

    return null;
};

const initSocket = async (server) => {
    io = socket(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {

        socket.on('join', async (data) => {
            try {
                const { userId } = data;
                if (!userId) return;

                await redisClient.set(userId, socket.id, {
                    EX: 24 * 60 * 60
                });

                await redisClient.set(socket.id, userId, {
                    EX: 24 * 60 * 60
                });

                await User.findOneAndUpdate({ _id: userId }, { socketId: socket.id }, { new: true });
            } catch (err) {
                console.warn('[Socket] Error on join:', err.message);
            }
        });

        socket.on('call-user', async (data) => {
            try {
                const { to, offer, from } = data;
                const callerId = from?._id ? from._id.toString() : from?.toString();
                const receiverId = to?._id ? to._id.toString() : to?.toString();

                if (!receiverId || !callerId || callerId === receiverId) {
                    socket.emit('call-failed', {
                        reason: 'invalid',
                        message: 'Invalid call recipient'
                    });
                    return;
                }

                // 1. Check if recipient is already engaged in an active call
                if (isUserInCall(receiverId)) {
                    socket.emit('call-rejected', {
                        reason: 'busy',
                        message: 'Partner is currently in another exchange call'
                    });
                    return;
                }

                // 2. Check if recipient is currently online and connected
                const receiverSocketId = await getReceiverSocketId(receiverId);
                if (!receiverSocketId) {
                    socket.emit('call-failed', {
                        reason: 'offline',
                        message: 'Partner is currently offline'
                    });

                    // Log missed call record immediately
                    await logCallRecord({
                        callerId,
                        receiverId,
                        status: 'missed',
                        duration: 0
                    });
                    return;
                }

                // 3. Available and online: record ringing state & dispatch offer
                const callKey = getCallKey(callerId, receiverId);
                activeCalls.delete(callKey);
                activeCalls.set(callKey, {
                    callerId,
                    receiverId,
                    status: 'ringing',
                    startedRingingAt: Date.now()
                });

                io.to(receiverSocketId).emit('incoming-call', { from, offer });

            } catch (err) {
                console.warn('[Socket] Error on call-user:', err.message);
                socket.emit('call-failed', {
                    reason: 'error',
                    message: 'Could not connect call'
                });
            }
        });

        socket.on('cancel-call', async (data) => {
            try {
                const { to, from } = data;
                const callerId = from?._id ? from._id.toString() : (from ? from.toString() : await redisClient.get(socket.id));
                const receiverId = to?._id ? to._id.toString() : to?.toString();
                const receiverSocketId = await getReceiverSocketId(receiverId);

                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('call-cancelled');
                }

                if (callerId && receiverId && callerId !== receiverId) {
                    const callKey = getCallKey(callerId, receiverId);
                    activeCalls.delete(callKey);

                    await logCallRecord({
                        callerId,
                        receiverId,
                        status: 'cancelled',
                        duration: 0
                    });
                }
            } catch (err) {
                console.warn('[Socket] Error on cancel-call:', err.message);
            }
        });

        socket.on('answer-call', async (data) => {
            try {
                const { to, answer, from } = data;
                const currentUserId = from?._id ? from._id.toString() : (from ? from.toString() : await redisClient.get(socket.id));
                const callerId = to?._id ? to._id.toString() : to?.toString();
                const receiverSocketId = await getReceiverSocketId(callerId);

                if (currentUserId && callerId) {
                    const callKey = getCallKey(callerId, currentUserId);
                    const existing = activeCalls.get(callKey) || {};
                    activeCalls.set(callKey, {
                        ...existing,
                        callerId: existing.callerId || callerId,
                        receiverId: existing.receiverId || currentUserId,
                        status: 'ongoing',
                        connectedAt: Date.now()
                    });
                }

                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('call-answered', { answer });
                }
            } catch (err) {
                console.warn('[Socket] Error on answer-call:', err.message);
            }
        });

        socket.on('ice-candidate', async (data) => {
            try {
                const { to, candidate } = data;
                const targetId = to?._id ? to._id.toString() : to?.toString();
                const receiverSocketId = await getReceiverSocketId(targetId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('ice-candidate', { candidate });
                }
            } catch (err) {
                console.warn('[Socket] Error on ice-candidate:', err.message);
            }
        });

        // Stage 2: Collaborative Studio Synchronization
        socket.on('studio-sync', async (data) => {
            try {
                const { to, ...payload } = data;
                const targetId = to?._id ? to._id.toString() : to?.toString();
                const receiverSocketId = await getReceiverSocketId(targetId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('studio-sync', payload);
                }
            } catch (err) {
                console.warn('[Socket] Error on studio-sync:', err.message);
            }
        });

        socket.on('studio-typing', async (data) => {
            try {
                const { to, isTyping, user } = data;
                const targetId = to?._id ? to._id.toString() : to?.toString();
                const receiverSocketId = await getReceiverSocketId(targetId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('studio-typing', { isTyping, user });
                }
            } catch (err) {
                console.warn('[Socket] Error on studio-typing:', err.message);
            }
        });

        socket.on('reject-call', async (data) => {
            try {
                const { to, reason, from } = data;
                const targetId = to?._id ? to._id.toString() : to?.toString();
                const receiverSocketId = await getReceiverSocketId(targetId);
                const currentUserId = from?._id ? from._id.toString() : (from ? from.toString() : await redisClient.get(socket.id));

                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('call-rejected', { reason: reason || 'declined' });
                }

                if (targetId && currentUserId && targetId !== currentUserId) {
                    const callKey = getCallKey(targetId, currentUserId);
                    activeCalls.delete(callKey);

                    await logCallRecord({
                        callerId: targetId,
                        receiverId: currentUserId,
                        status: reason === 'busy' ? 'missed' : 'declined',
                        duration: 0
                    });
                }
            } catch (err) {
                console.warn('[Socket] Error on reject-call:', err.message);
            }
        });

        socket.on('end-call', async (data) => {
            try {
                const { to, duration: clientDuration, from } = data;
                const currentUserId = from?._id ? from._id.toString() : (from ? from.toString() : await redisClient.get(socket.id));
                const targetId = to?._id ? to._id.toString() : to?.toString();
                const receiverSocketId = await getReceiverSocketId(targetId);

                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('call-ended', {
                        duration: clientDuration || 0
                    });
                }

                if (targetId && currentUserId && targetId !== currentUserId) {
                    const callKey = getCallKey(targetId, currentUserId);
                    const callData = activeCalls.get(callKey);
                    activeCalls.delete(callKey);

                    let duration = 0;
                    if (typeof clientDuration === 'number' && clientDuration > 0) {
                        duration = clientDuration;
                    } else if (callData?.connectedAt) {
                        duration = Math.max(1, Math.round((Date.now() - callData.connectedAt) / 1000));
                    }

                    // A call that was ongoing in activeCalls or has duration is logged as completed
                    const isSuccess = Boolean(callData?.status === 'ongoing' || duration > 0);
                    const finalDuration = isSuccess ? Math.max(1, duration) : 0;

                    // Guarantee two distinct participants:
                    // If callData was initialized, use its original callerId and receiverId
                    let callerId = callData?.callerId?.toString();
                    let receiverId = callData?.receiverId?.toString();

                    if (!callerId || !receiverId || callerId === receiverId) {
                        // Fallback: the person who was called is targetId, initiator is currentUserId (or vice-versa)
                        callerId = currentUserId;
                        receiverId = targetId;
                    }

                    if (callerId !== receiverId) {
                        await logCallRecord({
                            callerId,
                            receiverId,
                            status: isSuccess ? 'completed' : 'missed',
                            duration: finalDuration
                        });
                    }
                }
            } catch (err) {
                console.warn('[Socket] Error on end-call:', err.message);
            }
        });

        socket.on('disconnect', async () => {
            try {
                const userId = await redisClient.get(socket.id);
                if (userId) {
                    for (const [key, callData] of activeCalls.entries()) {
                        const isCaller = callData.callerId?.toString() === userId.toString();
                        const isReceiver = callData.receiverId?.toString() === userId.toString();

                        if (isCaller || isReceiver) {
                            activeCalls.delete(key);
                            const otherUserId = isCaller ? callData.receiverId : callData.callerId;
                            const otherSocketId = await getReceiverSocketId(otherUserId);
                            const duration = callData.connectedAt ? Math.max(1, Math.round((Date.now() - callData.connectedAt) / 1000)) : 0;

                            if (otherSocketId) {
                                io.to(otherSocketId).emit('call-ended', { duration });
                            }

                            const isSuccess = Boolean(callData.status === 'ongoing' || duration > 0);
                            const cId = callData.callerId?.toString();
                            const rId = callData.receiverId?.toString();

                            if (cId && rId && cId !== rId) {
                                await logCallRecord({
                                    callerId: cId,
                                    receiverId: rId,
                                    status: isSuccess ? 'completed' : 'missed',
                                    duration: isSuccess ? Math.max(1, duration) : 0
                                });
                            }
                        }
                    }

                    await redisClient.del(userId);
                    await redisClient.del(socket.id);
                    await User.findByIdAndUpdate(userId, { socketId: null });
                }
            } catch (err) {
                console.warn('[Socket] Error on disconnect cleanup:', err.message);
            }
        });
    });
};

async function sendMessages(socketId, message) {
    if (io && socketId)
        io.to(socketId).emit(message.event, message.data);
}

module.exports = {
    initSocket,
    sendMessages,
    getReceiverSocketId
};
