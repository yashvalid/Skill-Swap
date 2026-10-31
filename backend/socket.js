const socket = require('socket.io');
const User = require('./model/user.model');
const SkillSwap = require('./model/skillSwap.model');
const redisClient = require('./services/redis.service');

let io;

const getReceiverSocketId = async (receiverId) => {
    try {
        const socketId = await redisClient.get(receiverId);
        if (socketId) return socketId;
    } catch (err) {
        console.warn('[Socket] Redis lookup error:', err.message);
    }

    try {
        const user = await User.findById(receiverId).select('socketId');
        return user?.socketId || null;
    } catch (err) {
        return null;
    }
}

const initSocket = async (server) => {
    io = socket(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    })

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
                const receiverSocketId = await getReceiverSocketId(to);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('incoming-call', { from, offer });
                }
            } catch (err) {
                console.warn('[Socket] Error on call-user:', err.message);
            }
        });

        socket.on('answer-call', async (data) => {
            try {
                const { to, answer } = data;
                const receiverSocketId = await getReceiverSocketId(to);
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
                const receiverSocketId = await getReceiverSocketId(to);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('ice-candidate', { candidate });
                }
            } catch (err) {
                console.warn('[Socket] Error on ice-candidate:', err.message);
            }
        });

        socket.on('reject-call', async (data) => {
            try {
                const { to } = data;
                const receiverSocketId = await getReceiverSocketId(to);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('call-rejected');
                }
            } catch (err) {
                console.warn('[Socket] Error on reject-call:', err.message);
            }
        });

        socket.on('end-call', async (data) => {
            try {
                const { to } = data;
                const receiverSocketId = await getReceiverSocketId(to);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('call-ended');
                }
            } catch (err) {
                console.warn('[Socket] Error on end-call:', err.message);
            }
        });

        socket.on('disconnect', async () => {
            try {
                const userId = await redisClient.get(socket.id);
                if (userId) {
                    await redisClient.del(userId);
                    await redisClient.del(socket.id);
                }
            } catch (err) {
                console.warn('[Socket] Error on disconnect cleanup:', err.message);
            }
        });
    })
}

async function sendMessages(socketId, message) {
    if (io && socketId)
        io.to(socketId).emit(message.event, message.data);
}

module.exports = {
    initSocket,
    sendMessages,
    getReceiverSocketId
}
