const redis = require('redis');

const inMemoryStore = new Map();
const inMemoryExpiry = new Map();

const isExpired = (key) => {
    const exp = inMemoryExpiry.get(key);
    if (exp && Date.now() > exp) {
        inMemoryStore.delete(key);
        inMemoryExpiry.delete(key);
        return true;
    }
    return false;
};

let realClient = null;
let isConnected = false;

try {
    realClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 1) {
                    return false; // Stop reconnection loop if offline
                }
                return 1000;
            }
        }
    });

    realClient.on('error', () => {
        // Swallow unhandled connection errors when offline
    });

    realClient.connect()
        .then(() => {
            isConnected = true;
            console.log('[Redis] Connected to Redis server.');
        })
        .catch(() => {
            isConnected = false;
            console.log('[Redis] Redis offline. Transparently using in-memory store.');
        });
} catch (err) {
    isConnected = false;
}

const safeRedisClient = {
    get isOpen() {
        return isConnected && realClient?.isOpen;
    },

    async get(key) {
        if (this.isOpen) {
            try {
                return await realClient.get(key);
            } catch (err) {
                // Fall back to memory if connection dropped
            }
        }
        if (isExpired(key)) return null;
        return inMemoryStore.has(key) ? inMemoryStore.get(key) : null;
    },

    async set(key, value, options) {
        if (this.isOpen) {
            try {
                return await realClient.set(key, value, options);
            } catch (err) {
                // Fall back to memory
            }
        }
        inMemoryStore.set(key, String(value));
        if (options && options.EX) {
            inMemoryExpiry.set(key, Date.now() + options.EX * 1000);
        }
        return 'OK';
    },

    async setEx(key, ttl, value) {
        if (this.isOpen) {
            try {
                return await realClient.setEx(key, ttl, value);
            } catch (err) {
                // Fall back to memory
            }
        }
        inMemoryStore.set(key, String(value));
        inMemoryExpiry.set(key, Date.now() + ttl * 1000);
        return 'OK';
    },

    async del(keys) {
        if (this.isOpen) {
            try {
                return await realClient.del(keys);
            } catch (err) {
                // Fall back to memory
            }
        }
        const keyList = Array.isArray(keys) ? keys : [keys];
        let count = 0;
        for (const k of keyList) {
            if (inMemoryStore.delete(k)) {
                inMemoryExpiry.delete(k);
                count++;
            }
        }
        return count;
    },

    async scan(cursor, options) {
        if (this.isOpen) {
            try {
                return await realClient.scan(cursor, options);
            } catch (err) {
                // Fall back to memory
            }
        }
        const allKeys = Array.from(inMemoryStore.keys()).filter(k => !isExpired(k));
        const match = options?.MATCH;
        if (match && match.includes('*')) {
            const regex = new RegExp('^' + match.replace(/\*/g, '.*') + '$');
            return { cursor: 0, keys: allKeys.filter(k => regex.test(k)) };
        }
        return { cursor: 0, keys: allKeys };
    }
};

module.exports = safeRedisClient;
