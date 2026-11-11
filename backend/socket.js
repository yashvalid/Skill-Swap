const socket = require('socket.io');
const Messages = require('./model/message.model');
const redisClient = require('./services/redis.service');
const { invalidateCache } = require('./middlewares/cache');
const { verifyJwtToken } = require('./middlewares/authentication');

let io;

const PRESENCE_ONLINE_KEY = 'presence:online';
const PRESENCE_TTL_SECONDS = 180;
const CALL_RING_TTL_SECONDS = 75;
const CALL_ONGOING_TTL_SECONDS = 4 * 3600;
const MAX_STUDIO_SYNC_BYTES = 128 * 1024;

const userRoom = (userId) => `user:${userId.toString()}`;
const presenceSocketsKey = (userId) => `presence:sockets:${userId.toString()}`;
const getCallKey = (user1, user2) => [user1.toString(), user2.toString()].sort().join('_');
const callPairKey = (callKey) => `call:pair:${callKey}`;
const callUserKey = (userId) => `call:user:${userId.toString()}`;

const extractTargetId = (target) => {
    if (!target) return null;
    if (typeof target === 'object' && target._id) return target._id.toString();
    return target.toString();
};

const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const parseCookieToken = (cookieHeader = '') => {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
        if (cookie.startsWith('token=')) {
            return decodeURIComponent(cookie.slice('token='.length));
        }
    }
    return null;
};

const parseCallJson = (raw) => {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const getCallByKey = async (callKey) => {
    if (!callKey) return null;
    const raw = await redisClient.get(callPairKey(callKey));
    return parseCallJson(raw);
};

const saveCallState = async (callData, ttlSeconds) => {
    const ttl = ttlSeconds || CALL_RING_TTL_SECONDS;
    const key = callData.callKey;
    await Promise.all([
        redisClient.set(callPairKey(key), JSON.stringify(callData), { EX: ttl }),
        redisClient.set(callUserKey(callData.callerId), key, { EX: ttl }),
        redisClient.set(callUserKey(callData.receiverId), key, { EX: ttl }),
    ]);
};

const clearCallState = async (callKey, callerId, receiverId) => {
    if (!callKey) return;
    await redisClient.del(callPairKey(callKey));

    const userIds = [callerId, receiverId].filter(Boolean).map(id => id.toString());
    await Promise.all(
        userIds.map(async (uid) => {
            const activeKey = await redisClient.get(callUserKey(uid));
            if (activeKey === callKey) {
                await redisClient.del(callUserKey(uid));
            }
        })
    );
};

const isUserInCall = async (userId) => {
    if (!userId) return false;
    const uid = userId.toString();
    const activeCallKey = await redisClient.get(callUserKey(uid));
    if (!activeCallKey) return false;

    const call = await getCallByKey(activeCallKey);
    if (!call) {
        await redisClient.del(callUserKey(uid));
        return false;
    }

    const now = Date.now();
    if (call.status === 'ringing' && call.startedRingingAt && (now - call.startedRingingAt > 60000)) {
        await clearCallState(activeCallKey, call.callerId, call.receiverId);
        return false;
    }
    if (call.status === 'ongoing' && call.connectedAt && (now - call.connectedAt > CALL_ONGOING_TTL_SECONDS * 1000)) {
        await clearCallState(activeCallKey, call.callerId, call.receiverId);
        return false;
    }

    return call.status === 'ongoing' || call.status === 'ringing';
};

const registerUserSocket = async (userId, socketId) => {
    const uid = userId.toString();
    const setKey = presenceSocketsKey(uid);
    const prevCount = await redisClient.sCard(setKey);
    await redisClient.sAdd(setKey, socketId);
    await redisClient.expire(setKey, PRESENCE_TTL_SECONDS);
    await redisClient.sAdd(PRESENCE_ONLINE_KEY, uid);
    return prevCount === 0;
};

const unregisterUserSocket = async (userId, socketId) => {
    const uid = userId.toString();
    const setKey = presenceSocketsKey(uid);
    await redisClient.sRem(setKey, socketId);
    const remaining = await redisClient.sCard(setKey);
    if (remaining === 0) {
        await redisClient.del(setKey);
        await redisClient.sRem(PRESENCE_ONLINE_KEY, uid);
        return { remaining: 0, becameOffline: true };
    }
    await redisClient.expire(setKey, PRESENCE_TTL_SECONDS);
    return { remaining, becameOffline: false };
};

const isUserOnline = async (userId) => {
    if (!userId) return false;
    const count = await redisClient.sCard(presenceSocketsKey(userId));
    return count > 0;
};

const getOnlineUserIds = async () => {
    const candidates = await redisClient.sMembers(PRESENCE_ONLINE_KEY);
    if (!candidates.length) return [];

    const checks = await Promise.all(
        candidates.map(async (uid) => ({
            uid,
            online: (await redisClient.sCard(presenceSocketsKey(uid))) > 0
        }))
    );

    const stale = checks.filter(c => !c.online).map(c => c.uid);
    if (stale.length > 0) {
        await redisClient.sRem(PRESENCE_ONLINE_KEY, stale);
    }

    return checks.filter(c => c.online).map(c => c.uid);
};

const emitToUser = async (userId, event, data) => {
    if (!io || !userId || !event) return false;
    io.to(userRoom(userId)).emit(event, data);
    return true;
};

const logCallRecord = async ({ callerId, receiverId, status, duration = 0 }) => {
    try {
        if (!callerId || !receiverId) return null;
        const cId = callerId.toString();
        const rId = receiverId.toString();

        if (cId === rId) {
            console.warn('[Socket] Blocked attempt to log call record with identical caller and receiver:', cId);
            return null;
        }

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

        await emitToUser(cId, 'new-message', message);
        await emitToUser(rId, 'new-message', message);

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
    const online = await isUserOnline(receiverId);
    return online ? userRoom(receiverId) : null;
};

const attachRedisAdapter = async (ioInstance) => {
    try {
        const clients = await redisClient.createPubSubClients();
        if (!clients) return false;
        const { createAdapter } = require('@socket.io/redis-adapter');
        ioInstance.adapter(createAdapter(clients.pubClient, clients.subClient));
        console.log('[Socket] @socket.io/redis-adapter enabled for horizontal scaling.');
        return true;
    } catch (err) {
        console.warn('[Socket] Redis adapter unavailable, using in-memory adapter:', err.message);
        return false;
    }
};

const initSocket = async (server) => {
    const configuredOrigins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL;
    const allowedOrigins = configuredOrigins
        ? configuredOrigins.split(',').map(o => o.trim()).filter(Boolean)
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'];

    io = socket(server, {
        pingInterval: 20000,
        pingTimeout: 25000,
        maxHttpBufferSize: 1e6,
        cors: {
            origin: (origin, callback) => {
                if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                return callback(new Error('Not allowed by CORS'));
            },
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    await attachRedisAdapter(io);

    io.use(async (sock, next) => {
        try {
            const authHeader = sock.handshake.headers?.authorization;
            const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
            const cookieToken = parseCookieToken(sock.handshake.headers?.cookie);
            const token = sock.handshake.auth?.token || bearerToken || cookieToken;

            const verified = await verifyJwtToken(token);
            if (!verified) {
                return next(new Error('Unauthorized'));
            }

            sock.userId = verified.decoded._id.toString();
            sock.userProfile = {
                _id: verified.user._id.toString(),
                fullname: verified.user.fullname,
            };
            return next();
        } catch {
            return next(new Error('Unauthorized'));
        }
    });

    io.on('connection', async (sock) => {
        const authenticatedUserId = sock.userId;
        sock.join(userRoom(authenticatedUserId));

        try {
            const wasOffline = await registerUserSocket(authenticatedUserId, sock.id);
            if (wasOffline) {
                io.emit('presence-update', { userId: authenticatedUserId, online: true });
            }
            const onlineIds = await getOnlineUserIds();
            sock.emit('online-users', onlineIds);
        } catch (err) {
            console.warn('[Socket] Error registering user presence:', err.message);
        }

        sock.on('join', async () => {
            try {
                sock.join(userRoom(authenticatedUserId));
                const wasOffline = await registerUserSocket(authenticatedUserId, sock.id);
                if (wasOffline) {
                    io.emit('presence-update', { userId: authenticatedUserId, online: true });
                }
                const onlineIds = await getOnlineUserIds();
                sock.emit('online-users', onlineIds);
            } catch (err) {
                console.warn('[Socket] Error on join:', err.message);
            }
        });

        sock.on('presence-heartbeat', async (ack) => {
            try {
                sock.join(userRoom(authenticatedUserId));
                await registerUserSocket(authenticatedUserId, sock.id);
                if (typeof ack === 'function') ack({ ok: true });
            } catch {
                if (typeof ack === 'function') ack({ ok: false });
            }
        });

        sock.on('call-user', async (data) => {
            try {
                const { to, offer } = data || {};
                const callerId = authenticatedUserId;
                const receiverId = extractTargetId(to);

                if (!receiverId || !callerId || callerId === receiverId) {
                    sock.emit('call-failed', {
                        reason: 'invalid',
                        message: 'Invalid call recipient'
                    });
                    return;
                }

                if (await isUserInCall(receiverId) || await isUserInCall(callerId)) {
                    sock.emit('call-rejected', {
                        reason: 'busy',
                        message: 'Partner is currently in another exchange call'
                    });
                    return;
                }

                const online = await isUserOnline(receiverId);
                if (!online) {
                    sock.emit('call-failed', {
                        reason: 'offline',
                        message: 'Partner is currently offline'
                    });

                    await logCallRecord({
                        callerId,
                        receiverId,
                        status: 'missed',
                        duration: 0
                    });
                    return;
                }

                const callKey = getCallKey(callerId, receiverId);
                await saveCallState({
                    callKey,
                    callerId,
                    receiverId,
                    callerSocketId: sock.id,
                    receiverSocketId: null,
                    status: 'ringing',
                    startedRingingAt: Date.now()
                }, CALL_RING_TTL_SECONDS);

                await emitToUser(receiverId, 'incoming-call', {
                    from: sock.userProfile,
                    offer
                });
            } catch (err) {
                console.warn('[Socket] Error on call-user:', err.message);
                sock.emit('call-failed', {
                    reason: 'error',
                    message: 'Could not connect call'
                });
            }
        });

        sock.on('cancel-call', async (data) => {
            try {
                const { to } = data || {};
                const callerId = authenticatedUserId;
                const receiverId = extractTargetId(to);
                if (!receiverId) return;

                await emitToUser(receiverId, 'call-cancelled', { from: callerId });

                if (callerId !== receiverId) {
                    const callKey = getCallKey(callerId, receiverId);
                    await clearCallState(callKey, callerId, receiverId);

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

        sock.on('answer-call', async (data) => {
            try {
                const { to, answer } = data || {};
                const currentUserId = authenticatedUserId;
                const callerId = extractTargetId(to);
                if (!callerId) return;

                if (currentUserId !== callerId) {
                    const callKey = getCallKey(callerId, currentUserId);
                    const existing = (await getCallByKey(callKey)) || {};
                    await saveCallState({
                        ...existing,
                        callKey,
                        callerId: existing.callerId || callerId,
                        receiverId: existing.receiverId || currentUserId,
                        receiverSocketId: sock.id,
                        status: 'ongoing',
                        connectedAt: Date.now()
                    }, CALL_ONGOING_TTL_SECONDS);
                }

                await emitToUser(callerId, 'call-answered', { answer });
                sock.to(userRoom(currentUserId)).emit('call-handled', { peerId: callerId, action: 'answered' });
            } catch (err) {
                console.warn('[Socket] Error on answer-call:', err.message);
            }
        });

        sock.on('renegotiate-call', async (data) => {
            try {
                const { to, offer, answer, iceRestart } = data || {};
                const targetId = extractTargetId(to);
                if (!targetId || targetId === authenticatedUserId) return;

                await emitToUser(targetId, 'renegotiate-call', {
                    from: authenticatedUserId,
                    offer,
                    answer,
                    iceRestart: Boolean(iceRestart)
                });
            } catch (err) {
                console.warn('[Socket] Error on renegotiate-call:', err.message);
            }
        });

        sock.on('ice-candidate', async (data) => {
            try {
                const { to, candidate } = data || {};
                const targetId = extractTargetId(to);
                if (!targetId) return;

                await emitToUser(targetId, 'ice-candidate', {
                    from: authenticatedUserId,
                    candidate
                });
            } catch (err) {
                console.warn('[Socket] Error on ice-candidate:', err.message);
            }
        });

        sock.on('chat-typing', async (data) => {
            try {
                const { to, isTyping } = data || {};
                const targetId = extractTargetId(to);
                if (!targetId || targetId === authenticatedUserId) return;

                await emitToUser(targetId, 'chat-typing', {
                    from: authenticatedUserId,
                    isTyping: Boolean(isTyping)
                });
            } catch (err) {
                console.warn('[Socket] Error on chat-typing:', err.message);
            }
        });

        sock.on('studio-sync-request', async (data) => {
            try {
                const { to } = data || {};
                const targetId = extractTargetId(to);
                if (!targetId || targetId === authenticatedUserId) return;

                await emitToUser(targetId, 'studio-sync-request', {
                    from: authenticatedUserId
                });
            } catch (err) {
                console.warn('[Socket] Error on studio-sync-request:', err.message);
            }
        });

        sock.on('studio-sync', async (data) => {
            try {
                const { to, ...payload } = data || {};
                const targetId = extractTargetId(to);
                if (!targetId) return;

                const serializedSize = Buffer.byteLength(JSON.stringify(payload), 'utf8');
                if (serializedSize > MAX_STUDIO_SYNC_BYTES) {
                    console.warn('[Socket] Dropped oversized studio-sync payload from user:', authenticatedUserId);
                    return;
                }

                await emitToUser(targetId, 'studio-sync', {
                    ...payload,
                    from: authenticatedUserId
                });
            } catch (err) {
                console.warn('[Socket] Error on studio-sync:', err.message);
            }
        });

        sock.on('studio-typing', async (data) => {
            try {
                const { to, isTyping, user } = data || {};
                const targetId = extractTargetId(to);
                if (!targetId) return;

                await emitToUser(targetId, 'studio-typing', {
                    from: authenticatedUserId,
                    isTyping: Boolean(isTyping),
                    user
                });
            } catch (err) {
                console.warn('[Socket] Error on studio-typing:', err.message);
            }
        });

        sock.on('reject-call', async (data) => {
            try {
                const { to, reason } = data || {};
                const targetId = extractTargetId(to);
                const currentUserId = authenticatedUserId;
                if (!targetId) return;

                await emitToUser(targetId, 'call-rejected', { reason: reason || 'declined' });
                sock.to(userRoom(currentUserId)).emit('call-handled', { peerId: targetId, action: 'rejected' });

                if (targetId !== currentUserId) {
                    const callKey = getCallKey(targetId, currentUserId);
                    await clearCallState(callKey, targetId, currentUserId);

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

        sock.on('end-call', async (data) => {
            try {
                const { to, duration: clientDuration } = data || {};
                const currentUserId = authenticatedUserId;
                const targetId = extractTargetId(to);
                if (!targetId) return;

                await emitToUser(targetId, 'call-ended', {
                    duration: clientDuration || 0
                });

                if (targetId !== currentUserId) {
                    const callKey = getCallKey(targetId, currentUserId);
                    const callData = await getCallByKey(callKey);
                    await clearCallState(callKey, targetId, currentUserId);

                    const wasOngoing = callData?.status === 'ongoing';
                    let duration = 0;
                    if (wasOngoing) {
                        if (typeof clientDuration === 'number' && clientDuration > 0) {
                            duration = clientDuration;
                        } else if (callData?.connectedAt) {
                            duration = Math.max(1, Math.round((Date.now() - callData.connectedAt) / 1000));
                        } else {
                            duration = 1;
                        }
                    }

                    let callerId = callData?.callerId?.toString();
                    let receiverId = callData?.receiverId?.toString();

                    if (!callerId || !receiverId || callerId === receiverId) {
                        callerId = currentUserId;
                        receiverId = targetId;
                    }

                    if (callerId !== receiverId) {
                        await logCallRecord({
                            callerId,
                            receiverId,
                            status: wasOngoing ? 'completed' : 'missed',
                            duration: wasOngoing ? Math.max(1, duration) : 0
                        });
                    }
                }
            } catch (err) {
                console.warn('[Socket] Error on end-call:', err.message);
            }
        });

        sock.on('disconnect', async () => {
            try {
                const userId = authenticatedUserId;
                if (!userId) return;

                const { remaining, becameOffline } = await unregisterUserSocket(userId, sock.id);
                if (becameOffline) {
                    io.emit('presence-update', { userId, online: false });
                }

                const activeCallKey = await redisClient.get(callUserKey(userId));
                if (!activeCallKey) return;

                const callData = await getCallByKey(activeCallKey);
                if (!callData) {
                    await redisClient.del(callUserKey(userId));
                    return;
                }

                const socketOwnedCall =
                    sock.id === callData.callerSocketId ||
                    sock.id === callData.receiverSocketId;

                if (remaining === 0 || socketOwnedCall) {
                    await clearCallState(activeCallKey, callData.callerId, callData.receiverId);

                    const isCaller = callData.callerId?.toString() === userId.toString();
                    const otherUserId = isCaller ? callData.receiverId : callData.callerId;
                    const wasOngoing = callData.status === 'ongoing';
                    const duration = (wasOngoing && callData.connectedAt)
                        ? Math.max(1, Math.round((Date.now() - callData.connectedAt) / 1000))
                        : 0;

                    if (otherUserId) {
                        await emitToUser(otherUserId, 'call-ended', { duration });
                    }

                    const cId = callData.callerId?.toString();
                    const rId = callData.receiverId?.toString();
                    if (cId && rId && cId !== rId) {
                        await logCallRecord({
                            callerId: cId,
                            receiverId: rId,
                            status: wasOngoing ? 'completed' : 'missed',
                            duration: wasOngoing ? Math.max(1, duration) : 0
                        });
                    }
                }
            } catch (err) {
                console.warn('[Socket] Error on disconnect cleanup:', err.message);
            }
        });
    });

    return io;
};

const closeSocket = async () => {
    if (!io) return;
    const instance = io;
    io = null;
    await new Promise((resolve) => instance.close(() => resolve()));
};

async function sendMessages(targetRoomOrSocketId, message) {
    if (io && targetRoomOrSocketId && message?.event) {
        io.to(targetRoomOrSocketId).emit(message.event, message.data);
    }
}

module.exports = {
    initSocket,
    closeSocket,
    emitToUser,
    isUserOnline,
    getOnlineUserIds,
    sendMessages,
    getReceiverSocketId
};
