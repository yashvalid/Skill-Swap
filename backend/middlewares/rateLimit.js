const redisClient = require('../services/redis.service');

/**
 * Creates a Redis-backed fixed-window rate limiter middleware that scales across instances.
 * Falls back transparently to redisClient's in-memory store when Redis is offline.
 */
function createRateLimiter({
    windowMs = 60 * 1000,
    max = 60,
    prefix = 'rl',
    message = 'Too many requests. Please slow down.',
    keyGenerator,
    skipInTest = true,
} = {}) {
    const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));

    return async (req, res, next) => {
        if (skipInTest && process.env.NODE_ENV === 'test') {
            return next();
        }

        try {
            const rawKey = keyGenerator
                ? keyGenerator(req)
                : (req.user?._id?.toString() || req.ip || req.socket?.remoteAddress || 'anonymous');
            const safeIdentifier = String(rawKey || 'anonymous').slice(0, 160);
            const redisKey = `ratelimit:${prefix}:${safeIdentifier}`;

            const count = await redisClient.incrWithExpiry(redisKey, ttlSeconds);
            const remaining = Math.max(0, max - count);

            res.setHeader('X-RateLimit-Limit', String(max));
            res.setHeader('X-RateLimit-Remaining', String(remaining));

            if (count > max) {
                res.setHeader('Retry-After', String(ttlSeconds));
                return res.status(429).json({ message });
            }
        } catch {
            // Fail open on unexpected store failure so core API availability is preserved
        }

        return next();
    };
}

module.exports = { createRateLimiter };
