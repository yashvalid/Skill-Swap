const socket = require('socket.io');
const User = require('./model/user.model');
const SkillSwap = require('./model/skillSwap.model');
const redisClient = require('./services/redis.service');

let io;

const getReceiverSocketId = async (receiverId) => {
    return await redisClient.get(receiverId);
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
            const { userId } = data;
            if (!userId) return;

            await redisClient.set(userId, socket.id, {
                EX: 24 * 60 * 60
            });

            await redisClient.set(socket.id, userId, {
                EX: 24 * 60 * 60
            });

            await User.findOneAndUpdate({ _id: userId }, { socketId: socket.id }, { new: true });
        })

        socket.on('call-user', async (data) => {
            const { to, offer, from } = data;
            const receiverSocketId = await getReceiverSocketId(to);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('incoming-call', { from, offer });
            }
        });

        socket.on('answer-call', async (data) => {
            const { to, answer } = data;
            const receiverSocketId = await getReceiverSocketId(to);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call-answered', { answer });
            }
        });

        socket.on('ice-candidate', async (data) => {
            const { to, candidate } = data;
            const receiverSocketId = await getReceiverSocketId(to);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('ice-candidate', { candidate });
            }
        });

        socket.on('reject-call', async (data) => {
            const { to } = data;
            const receiverSocketId = await getReceiverSocketId(to);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call-rejected');
            }
        });

        socket.on('end-call', async (data) => {
            const { to } = data;
            const receiverSocketId = await getReceiverSocketId(to);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call-ended');
            }
        });

        socket.on('disconnect', async () => {
            const userId = await redisClient.get(socket.id);
            if (userId) {
                await redisClient.del(userId);
                await redisClient.del(socket.id);
            }
        });
    })
}

async function sendMessages(socketId, message) {
    console.log("sending message to", socketId, message)
    if (io)
        io.to(socketId).emit(message.event, message.data);
    else
        console.log("socket not initialized")
}

module.exports = {
    initSocket,
    sendMessages,
    getReceiverSocketId
}