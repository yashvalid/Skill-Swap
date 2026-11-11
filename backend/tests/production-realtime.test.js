process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const http = require('http');
const mongoose = require('mongoose');

const redisClient = require('../services/redis.service');
const { createRateLimiter } = require('../middlewares/rateLimit');
const userController = require('../controllers/user.controllers');
const messagesService = require('../services/messages.services');
const messagesController = require('../controllers/messages.controllers');
const postController = require('../controllers/post.controller');
const { initSocket, closeSocket, emitToUser } = require('../socket');
const app = require('../app');

const User = require('../model/user.model');
const SkillSwap = require('../model/skillSwap.model');
const Skills = require('../model/Skills.model');
const Messages = require('../model/message.model');
const { postModel, commentModel } = require('../model/post.model');

const createMockRes = () => {
    const res = {
        statusCode: 200,
        body: null,
        headers: {},
        clearedCookies: [],
        setHeader(name, value) {
            this.headers[name.toLowerCase()] = value;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
        clearCookie(name, opts) {
            this.clearedCookies.push({ name, opts });
            return this;
        }
    };
    return res;
};

describe('Production Infrastructure: Rate Limiting, Health & ICE Config', () => {
    it('supports distributed Redis primitives (incrWithExpiry, sets, expire, exists)', async () => {
        const counterKey = 'test:counter:1';
        const setKey = 'test:set:1';
        await redisClient.del([counterKey, setKey]);

        const c1 = await redisClient.incrWithExpiry(counterKey, 30);
        const c2 = await redisClient.incrWithExpiry(counterKey, 30);
        assert.equal(c1, 1);
        assert.equal(c2, 2);

        await redisClient.sAdd(setKey, ['sock-a', 'sock-b']);
        assert.equal(await redisClient.sCard(setKey), 2);
        await redisClient.sRem(setKey, 'sock-a');
        assert.deepEqual(await redisClient.sMembers(setKey), ['sock-b']);
        assert.equal(await redisClient.exists(setKey), 1);

        await redisClient.del([counterKey, setKey]);
        assert.equal(await redisClient.exists(setKey), 0);
    });

    it('enforces fixed-window rate limits across calls and emits X-RateLimit headers', async () => {
        const prefix = `rl-test-${Date.now()}`;
        const limiter = createRateLimiter({
            prefix,
            windowMs: 60000,
            max: 2,
            skipInTest: false,
            keyGenerator: () => 'client-1'
        });

        let nextCount = 0;
        const next = () => { nextCount += 1; };

        const res1 = createMockRes();
        await limiter({}, res1, next);
        assert.equal(nextCount, 1);
        assert.equal(res1.headers['x-ratelimit-limit'], '2');
        assert.equal(res1.headers['x-ratelimit-remaining'], '1');

        const res2 = createMockRes();
        await limiter({}, res2, next);
        assert.equal(nextCount, 2);
        assert.equal(res2.headers['x-ratelimit-remaining'], '0');

        const res3 = createMockRes();
        await limiter({}, res3, next);
        assert.equal(nextCount, 2);
        assert.equal(res3.statusCode, 429);
        assert.ok(res3.headers['retry-after']);

        await redisClient.del(`ratelimit:${prefix}:client-1`);
    });

    it('builds valid HMAC-SHA1 time-limited TURN credentials when TURN_STATIC_SECRET is set', () => {
        const prevUrls = process.env.TURN_URLS;
        const prevSecret = process.env.TURN_STATIC_SECRET;
        process.env.TURN_URLS = 'turn:turn.example.com:3478?transport=udp,turns:turn.example.com:5349?transport=tcp';
        process.env.TURN_STATIC_SECRET = 'super_turn_secret_value';

        try {
            const servers = userController.buildIceServers('user-abc');
            const turnEntry = servers.find(s => Array.isArray(s.urls));
            assert.ok(turnEntry, 'Expected TURN entry in ICE server list');
            assert.ok(turnEntry.username.endsWith(':user-abc'));
            const expectedDigest = crypto
                .createHmac('sha1', 'super_turn_secret_value')
                .update(turnEntry.username)
                .digest('base64');
            assert.equal(turnEntry.credential, expectedDigest);
        } finally {
            if (prevUrls === undefined) delete process.env.TURN_URLS; else process.env.TURN_URLS = prevUrls;
            if (prevSecret === undefined) delete process.env.TURN_STATIC_SECRET; else process.env.TURN_STATIC_SECRET = prevSecret;
        }
    });

    it('reports /health 200 and /ready 503 when MongoDB is disconnected', async () => {
        const server = http.createServer(app);
        await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
        const { port } = server.address();

        try {
            const healthRes = await fetch(`http://127.0.0.1:${port}/health`);
            assert.equal(healthRes.status, 200);

            const readyRes = await fetch(`http://127.0.0.1:${port}/ready`);
            assert.equal(readyRes.status, 503);
            const readyBody = await readyRes.json();
            assert.equal(readyBody.status, 'not_ready');
            assert.equal(readyBody.db, 'disconnected');
        } finally {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    it('initializes and shuts down Socket.IO server cleanly without open handles', async () => {
        const server = http.createServer();
        const io = await initSocket(server);
        assert.ok(io);
        const emitted = await emitToUser('some-user-id', 'ping-test', { ok: true });
        assert.equal(emitted, true);
        await closeSocket();
        await new Promise((resolve) => server.close(resolve));
    });
});

describe('Messaging Pagination, Read Receipts, Feed & Account Deletion', () => {
    const originals = {
        messagesFind: Messages.find,
        messagesUpdateMany: Messages.updateMany,
        userDelete: User.findByIdAndDelete,
        skillsDeleteMany: Skills.deleteMany,
        swapDeleteMany: SkillSwap.deleteMany,
        messagesDeleteMany: Messages.deleteMany,
        postFind: postModel.find,
        postCount: postModel.countDocuments,
        postDeleteMany: postModel.deleteMany,
        commentAggregate: commentModel.aggregate,
        commentDeleteMany: commentModel.deleteMany,
        swapCount: SkillSwap.countDocuments,
        userFind: User.find,
    };

    afterEach(() => {
        Messages.find = originals.messagesFind;
        Messages.updateMany = originals.messagesUpdateMany;
        User.findByIdAndDelete = originals.userDelete;
        Skills.deleteMany = originals.skillsDeleteMany;
        SkillSwap.deleteMany = originals.swapDeleteMany;
        Messages.deleteMany = originals.messagesDeleteMany;
        postModel.find = originals.postFind;
        postModel.countDocuments = originals.postCount;
        postModel.deleteMany = originals.postDeleteMany;
        commentModel.aggregate = originals.commentAggregate;
        commentModel.deleteMany = originals.commentDeleteMany;
        SkillSwap.countDocuments = originals.swapCount;
        User.find = originals.userFind;
    });

    it('paginates messages with before cursor, returns ascending order and hasMore flag', async () => {
        const newestFirst = [
            { _id: 'm3', createdAt: new Date('2026-01-03T00:00:00Z'), text: 'three' },
            { _id: 'm2', createdAt: new Date('2026-01-02T00:00:00Z'), text: 'two' },
            { _id: 'm1', createdAt: new Date('2026-01-01T00:00:00Z'), text: 'one' },
        ];
        let capturedFilter = null;
        Messages.find = (filter) => {
            capturedFilter = filter;
            return {
                sort: () => ({
                    limit: () => ({
                        lean: async () => newestFirst
                    })
                })
            };
        };

        const result = await messagesService.getMessages('u1', 'u2', {
            limit: 2,
            before: '2026-01-04T00:00:00Z'
        });

        assert.equal(result.hasMore, true);
        assert.deepEqual(result.messages.map(m => m._id), ['m2', 'm3']);
        assert.ok(capturedFilter.createdAt.$lt instanceof Date);
    });

    it('markSeen marks unread incoming messages as seen and validates partnerId', async () => {
        const u1 = new mongoose.Types.ObjectId();
        const u2 = new mongoose.Types.ObjectId();
        let capturedUpdate = null;

        Messages.updateMany = async (filter, update) => {
            capturedUpdate = { filter, update };
            return { modifiedCount: 3 };
        };

        const badRes = createMockRes();
        await messagesController.markSeen({ user: { _id: u1 }, body: { partnerId: u1.toString() } }, badRes);
        assert.equal(badRes.statusCode, 400);

        const okRes = createMockRes();
        await messagesController.markSeen({ user: { _id: u1 }, body: { partnerId: u2.toString() } }, okRes);
        assert.equal(okRes.statusCode, 200);
        assert.equal(okRes.body.updated, 3);
        assert.deepEqual(capturedUpdate.update, { $set: { isSeen: true } });
    });

    it('deleteAccount removes user record and cascades deletion across related collections', async () => {
        const userId = new mongoose.Types.ObjectId();
        const deletedCollections = [];

        postModel.find = () => ({
            select: () => ({
                lean: async () => [{ _id: 'p1' }]
            })
        });
        User.findByIdAndDelete = async (id) => ({ _id: id });
        Skills.deleteMany = async () => { deletedCollections.push('skills'); };
        SkillSwap.deleteMany = async () => { deletedCollections.push('swaps'); };
        Messages.deleteMany = async () => { deletedCollections.push('messages'); };
        postModel.deleteMany = async () => { deletedCollections.push('posts'); };
        commentModel.deleteMany = async (filter) => {
            deletedCollections.push('comments');
            assert.equal(filter.$or.length, 2);
        };

        const res = createMockRes();
        await userController.deleteAccount({ user: { _id: userId } }, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.clearedCookies.length, 1);
        assert.deepEqual(deletedCollections.sort(), ['comments', 'messages', 'posts', 'skills', 'swaps']);
    });

    it('getAllPosts returns pagination metadata (page, limit, total, hasMore) alongside total stats', async () => {
        const fakePosts = [{ _id: new mongoose.Types.ObjectId(), likes: [] }, { _id: new mongoose.Types.ObjectId(), likes: [] }];
        postModel.find = () => ({
            populate: () => ({
                sort: () => ({
                    skip: () => ({
                        limit: () => ({
                            lean: async () => fakePosts
                        })
                    })
                })
            })
        });
        postModel.countDocuments = async () => 5;
        commentModel.aggregate = async () => [];
        SkillSwap.countDocuments = async () => 12;
        User.find = () => ({
            select: () => ({
                lean: async () => [{ averageRating: 4.8 }]
            })
        });

        const res = createMockRes();
        await postController.getAllPosts({ query: { page: '1', limit: '2' } }, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.page, 1);
        assert.equal(res.body.limit, 2);
        assert.equal(res.body.total, 5);
        assert.equal(res.body.hasMore, true);
        assert.equal(res.body.stats.totalShowcases, 5);
        assert.equal(res.body.stats.completedSwaps, 12);
    });

    it('keeps encryptedKeyBackup select: false on User schema and allows owner updateProfile persistence', async () => {
        assert.equal(User.schema.path('encryptedKeyBackup').options.select, false);

        const origFindByIdAndUpdate = User.findByIdAndUpdate;
        let capturedSet = null;
        User.findByIdAndUpdate = (_id, update) => {
            capturedSet = update.$set;
            return {
                select: async () => ({ _id: 'u1', ...update.$set })
            };
        };

        try {
            const res = createMockRes();
            await userController.updateProfile({
                user: { _id: 'u1' },
                body: { publicKey: '{"kty":"EC"}', encryptedKeyBackup: '{"v":1,"ct":"abc"}' }
            }, res);

            assert.equal(res.statusCode, 200);
            assert.equal(capturedSet.publicKey, '{"kty":"EC"}');
            assert.equal(capturedSet.encryptedKeyBackup, '{"v":1,"ct":"abc"}');
        } finally {
            User.findByIdAndUpdate = origFindByIdAndUpdate;
        }
    });
});
