const redis = require('redis');

const inMemoryStore = new Map();
const inMemorySets = new Map();
const inMemoryExpiry = new Map();

const isExpired = (key) => {
    const exp = inMemoryExpiry.get(key);
    if (exp && Date.now() > exp) {
        inMemoryStore.delete(key);
        inMemorySets.delete(key);
        inMemoryExpiry.delete(key);
        return true;
    }
    return false;
};

let realClient = null;
let isConnected = false;
let connectPromise = null;
const extraClients = [];

const shouldKeepReconnecting = Boolean(process.env.REDIS_URL) || process.env.NODE_ENV === 'production';

if (process.env.NODE_ENV !== 'test') {
    try {
        realClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (!shouldKeepReconnecting && retries > 1) {
                        return false; // Stop reconnection loop when local Redis is intentionally offline
                    }
                    return Math.min((retries + 1) * 250, 5000);
                }
            }
        });

        realClient.on('ready', () => {
            isConnected = true;
        });

        realClient.on('end', () => {
            isConnected = false;
        });

        realClient.on('reconnecting', () => {
            isConnected = false;
        });

        realClient.on('error', () => {
            // Swallow unhandled connection errors when offline
        });

        connectPromise = realClient.connect()
            .then(() => {
                isConnected = true;
                console.log('[Redis] Connected to Redis server.');
                return true;
            })
            .catch(() => {
                isConnected = false;
                console.log('[Redis] Redis offline. Transparently using in-memory store.');
                return false;
            });
    } catch {
        isConnected = false;
        connectPromise = Promise.resolve(false);
    }
} else {
    connectPromise = Promise.resolve(false);
}

const safeRedisClient = {
    get isOpen() {
        return Boolean(isConnected && realClient?.isOpen);
    },

    async waitUntilReady() {
        if (connectPromise) {
            await connectPromise;
        }
        return this.isOpen;
    },

    async ping() {
        if (this.isOpen) {
            try {
                return (await realClient.ping()) === 'PONG';
            } catch {
                return false;
            }
        }
        return false;
    },

    async get(key) {
        if (this.isOpen) {
            try {
                return await realClient.get(key);
            } catch {
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
            } catch {
                // Fall back to memory
            }
        }
        inMemoryStore.set(key, String(value));
        if (options && options.EX) {
            inMemoryExpiry.set(key, Date.now() + options.EX * 1000);
        } else {
            inMemoryExpiry.delete(key);
        }
        return 'OK';
    },

    async setEx(key, ttl, value) {
        if (this.isOpen) {
            try {
                return await realClient.setEx(key, ttl, value);
            } catch {
                // Fall back to memory
            }
        }
        inMemoryStore.set(key, String(value));
        inMemoryExpiry.set(key, Date.now() + ttl * 1000);
        return 'OK';
    },

    async exists(key) {
        if (this.isOpen) {
            try {
                return await realClient.exists(key);
            } catch {
                // Fall back to memory
            }
        }
        if (isExpired(key)) return 0;
        return (inMemoryStore.has(key) || inMemorySets.has(key)) ? 1 : 0;
    },

    async expire(key, ttlSeconds) {
        if (this.isOpen) {
            try {
                return await realClient.expire(key, ttlSeconds);
            } catch {
                // Fall back to memory
            }
        }
        if (isExpired(key)) return 0;
        if (!inMemoryStore.has(key) && !inMemorySets.has(key)) return 0;
        inMemoryExpiry.set(key, Date.now() + ttlSeconds * 1000);
        return 1;
    },

    async incr(key) {
        if (this.isOpen) {
            try {
                return await realClient.incr(key);
            } catch {
                // Fall back to memory
            }
        }
        isExpired(key);
        const current = Number(inMemoryStore.get(key) || '0');
        const next = Number.isFinite(current) ? current + 1 : 1;
        inMemoryStore.set(key, String(next));
        return next;
    },

    /**
     * Atomically increments a counter and ensures a window TTL is attached on the first hit.
     */
    async incrWithExpiry(key, ttlSeconds) {
        if (this.isOpen) {
            try {
                const count = await realClient.incr(key);
                if (count === 1) {
                    await realClient.expire(key, ttlSeconds);
                } else {
                    const ttl = await realClient.ttl(key);
                    if (ttl < 0) {
                        await realClient.expire(key, ttlSeconds);
                    }
                }
                return count;
            } catch {
                // Fall back to memory
            }
        }
        isExpired(key);
        const prev = inMemoryStore.get(key);
        const next = prev ? (Number(prev) || 0) + 1 : 1;
        inMemoryStore.set(key, String(next));
        if (!inMemoryExpiry.has(key)) {
            inMemoryExpiry.set(key, Date.now() + ttlSeconds * 1000);
        }
        return next;
    },

    async sAdd(key, members) {
        const list = Array.isArray(members) ? members.map(String) : [String(members)];
        if (list.length === 0) return 0;
        if (this.isOpen) {
            try {
                return await realClient.sAdd(key, list);
            } catch {
                // Fall back to memory
            }
        }
        isExpired(key);
        let set = inMemorySets.get(key);
        if (!set) {
            set = new Set();
            inMemorySets.set(key, set);
        }
        let added = 0;
        for (const item of list) {
            if (!set.has(item)) {
                set.add(item);
                added++;
            }
        }
        return added;
    },

    async sRem(key, members) {
        const list = Array.isArray(members) ? members.map(String) : [String(members)];
        if (list.length === 0) return 0;
        if (this.isOpen) {
            try {
                return await realClient.sRem(key, list);
            } catch {
                // Fall back to memory
            }
        }
        if (isExpired(key)) return 0;
        const set = inMemorySets.get(key);
        if (!set) return 0;
        let removed = 0;
        for (const item of list) {
            if (set.delete(item)) removed++;
        }
        if (set.size === 0) {
            inMemorySets.delete(key);
            inMemoryExpiry.delete(key);
        }
        return removed;
    },

    async sMembers(key) {
        if (this.isOpen) {
            try {
                return await realClient.sMembers(key);
            } catch {
                // Fall back to memory
            }
        }
        if (isExpired(key)) return [];
        const set = inMemorySets.get(key);
        return set ? Array.from(set) : [];
    },

    async sCard(key) {
        if (this.isOpen) {
            try {
                return await realClient.sCard(key);
            } catch {
                // Fall back to memory
            }
        }
        if (isExpired(key)) return 0;
        const set = inMemorySets.get(key);
        return set ? set.size : 0;
    },

    async del(keys) {
        if (this.isOpen) {
            try {
                return await realClient.del(keys);
            } catch {
                // Fall back to memory
            }
        }
        const keyList = Array.isArray(keys) ? keys : [keys];
        let count = 0;
        for (const k of keyList) {
            const removedKv = inMemoryStore.delete(k);
            const removedSet = inMemorySets.delete(k);
            inMemoryExpiry.delete(k);
            if (removedKv || removedSet) {
                count++;
            }
        }
        return count;
    },

    async scan(cursor, options) {
        if (this.isOpen) {
            try {
                return await realClient.scan(cursor, options);
            } catch {
                // Fall back to memory
            }
        }
        const kvKeys = Array.from(inMemoryStore.keys());
        const setKeys = Array.from(inMemorySets.keys());
        const allKeys = Array.from(new Set([...kvKeys, ...setKeys])).filter(k => !isExpired(k));
        const match = options?.MATCH;
        if (match && match.includes('*')) {
            const escaped = match.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
            const regex = new RegExp('^' + escaped + '$');
            return { cursor: '0', keys: allKeys.filter(k => regex.test(k)) };
        }
        return { cursor: '0', keys: allKeys };
    },

    /**
     * Creates dedicated connected pub/sub clients for @socket.io/redis-adapter.
     */
    async createPubSubClients() {
        await this.waitUntilReady();
        if (!this.isOpen || !realClient) {
            return null;
        }
        try {
            const pubClient = realClient.duplicate();
            const subClient = realClient.duplicate();
            pubClient.on('error', () => {});
            subClient.on('error', () => {});
            await Promise.all([pubClient.connect(), subClient.connect()]);
            extraClients.push(pubClient, subClient);
            return { pubClient, subClient };
        } catch (err) {
            console.warn('[Redis] Failed to initialize Pub/Sub clients:', err.message);
            return null;
        }
    },

    async quit() {
        isConnected = false;
        const clients = [...extraClients, realClient].filter(Boolean);
        extraClients.length = 0;
        await Promise.allSettled(
            clients.map(async (client) => {
                if (client.isOpen) {
                    await client.quit().catch(() => client.disconnect());
                }
            })
        );
    }
};

module.exports = safeRedisClient;
