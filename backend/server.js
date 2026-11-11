const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const { initSocket, closeSocket } = require('./socket');
const redisClient = require('./services/redis.service');

const port = process.env.PORT || 9000;
const server = http.createServer(app);
let isShuttingDown = false;

const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);

    const forceTimer = setTimeout(() => {
        console.error('[Server] Graceful shutdown timed out, forcing exit.');
        process.exit(1);
    }, 10000);
    forceTimer.unref();

    try {
        await closeSocket();
        await new Promise((resolve) => server.close(() => resolve()));
        await redisClient.quit();
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        clearTimeout(forceTimer);
        console.log('[Server] Shutdown complete.');
        process.exit(0);
    } catch (err) {
        console.error('[Server] Error during shutdown:', err.message);
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

initSocket(server)
    .then(() => {
        server.listen(port, () => {
            console.log('server is running on port ' + port);
        });
    })
    .catch((err) => {
        console.error('[Server] Failed to initialize real-time layer:', err.message);
        process.exit(1);
    });
