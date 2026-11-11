process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';
process.env.ALLOWED_ORIGINS = 'https://app.skillswap.example';
delete process.env.GEMINI_API_KEY;

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../model/user.model');
const SkillSwap = require('../model/skillSwap.model');
const Skills = require('../model/Skills.model');
const redisClient = require('../services/redis.service');
const { cache, invalidateCache } = require('../middlewares/cache');
const userController = require('../controllers/user.controllers');
const userService = require('../services/user.services');
const skillSwapService = require('../services/skillSwap.services');
const skillsService = require('../services/skills.services');
const aiService = require('../services/ai.service');
const matchingService = require('../services/matching.services');
const app = require('../app');

const createMockRes = () => {
    const res = {
        statusCode: 200,
        body: null,
        cookies: {},
        clearedCookies: [],
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
        cookie(name, val, opts) {
            this.cookies[name] = { val, opts };
            return this;
        },
        clearCookie(name, opts) {
            this.clearedCookies.push({ name, opts });
            return this;
        }
    };
    return res;
};

describe('CORS & User Security', () => {
    it('rejects unknown origin in production mode while allowing configured origin', () => {
        const prevEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        try {
            assert.equal(app.isOriginAllowed('https://app.skillswap.example'), true);
            assert.equal(app.isOriginAllowed('https://evil.example.com'), false);
        } finally {
            process.env.NODE_ENV = prevEnv;
        }
    });

    it('generates expiring JWTs and strips password/__v from User JSON', () => {
        const user = new User({
            fullname: { firstname: 'Alice', lastname: 'Dev' },
            email: 'alice@example.com',
            password: 'hashed_secret_password',
            role: 'Engineer',
            bio: 'Builds things'
        });

        const token = user.generateToken();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        assert.ok(decoded.exp, 'JWT must include an exp expiration claim');

        const serialized = JSON.parse(JSON.stringify(user));
        assert.equal(serialized.password, undefined);
        assert.equal(serialized.__v, undefined);
        assert.equal(serialized.email, 'alice@example.com');
    });
});

describe('Redis In-Memory Fallback & Cache Invalidation', () => {
    it('completes wildcard cache invalidation cleanly without infinite cursor loop', async () => {
        await redisClient.setEx('cache:/posts/all?page=1', 60, JSON.stringify({ posts: [] }));
        await redisClient.setEx('cache:/posts/all', 60, JSON.stringify({ posts: [] }));
        await redisClient.setEx('other:key', 60, 'keep');

        await invalidateCache('cache:/posts/all*');

        assert.equal(await redisClient.get('cache:/posts/all'), null);
        assert.equal(await redisClient.get('cache:/posts/all?page=1'), null);
        assert.equal(await redisClient.get('other:key'), 'keep');
        await redisClient.del('other:key');
    });

    it('keeps res.json synchronous in cache middleware and caches status 200 responses', async () => {
        const key = 'cache:/test-sync';
        await redisClient.del(key);

        const req = { originalUrl: '/test-sync' };
        const res = createMockRes();
        let nextCalled = false;

        await cache(60, () => key)(req, res, () => { nextCalled = true; });
        assert.equal(nextCalled, true);

        const chained = res.status(200).json({ ok: true });
        assert.equal(chained, res, 'res.json must return res synchronously for chaining');

        await new Promise(resolve => setTimeout(resolve, 10));
        const cached = await redisClient.get(key);
        assert.deepEqual(JSON.parse(cached), { ok: true });
        await redisClient.del(key);
    });
});

describe('Controller & Service Authorization Guards', () => {
    const origFindOneUser = User.findOne;
    const origHashPass = User.hashPass;
    const origRegService = userService.registerUser;
    const origFindByIdAndUpdate = User.findByIdAndUpdate;
    const origSwapExists = SkillSwap.exists;
    const origSwapFindById = SkillSwap.findById;
    const origSwapFindOneAndUpdate = SkillSwap.findOneAndUpdate;
    const origSkillFindOneAndDelete = Skills.findOneAndDelete;

    beforeEach(() => {
        User.findOne = origFindOneUser;
        User.hashPass = origHashPass;
        userService.registerUser = origRegService;
        User.findByIdAndUpdate = origFindByIdAndUpdate;
        SkillSwap.exists = origSwapExists;
        SkillSwap.findById = origSwapFindById;
        SkillSwap.findOneAndUpdate = origSwapFindOneAndUpdate;
        Skills.findOneAndDelete = origSkillFindOneAndDelete;
    });

    it('registerUser issues JWT token + httpOnly cookie without exposing password hash', async () => {
        User.findOne = async () => null;
        User.hashPass = async (pw) => `hashed_${pw}`;
        userService.registerUser = async (data) => new User({ ...data, fullname: { firstname: data.firstname, lastname: data.lastname } });

        const req = {
            body: {
                fullname: { firstname: 'Bob', lastname: 'Builder' },
                email: 'Bob@Example.com',
                password: 'password123',
                role: 'Designer',
                location: 'Remote',
                bio: 'UX specialist',
                agreedToPrivacyPolicy: true
            }
        };
        const res = createMockRes();
        await userController.registerUser(req, res);

        assert.equal(res.statusCode, 201);
        assert.ok(res.body.token, 'registerUser must return JWT token');
        assert.equal(res.cookies.token?.opts?.httpOnly, true);
        const serialized = JSON.parse(JSON.stringify(res.body.user));
        assert.equal(serialized.password, undefined);
    });

    it('updateProfile only sets allowlisted fields and ignores credits/isVerified/ratings', async () => {
        let capturedUpdate = null;
        User.findByIdAndUpdate = (_id, update) => {
            capturedUpdate = update;
            return {
                select: async () => ({ _id: 'u1', bio: 'Clean bio', credits: 3, isVerified: false })
            };
        };

        const req = {
            user: { _id: 'u1' },
            body: {
                bio: '  Clean bio  ',
                credits: 9999,
                isVerified: true,
                ratings: [{ rating: 5 }],
                password: 'hacked',
                email: 'evil@example.com'
            }
        };
        const res = createMockRes();
        await userController.updateProfile(req, res);

        assert.equal(res.statusCode, 200);
        assert.deepEqual(capturedUpdate, { $set: { bio: 'Clean bio' } });
    });

    it('rateUser rejects ratings out of range or without an accepted/completed swap', async () => {
        const targetId = new mongoose.Types.ObjectId().toString();
        const reviewerId = new mongoose.Types.ObjectId().toString();

        // Out of range
        const resBadRange = createMockRes();
        await userController.rateUser(
            { user: { _id: reviewerId }, params: { id: targetId }, body: { rating: 10, review: 'Great' } },
            resBadRange
        );
        assert.equal(resBadRange.statusCode, 400);

        // No swap connection
        SkillSwap.exists = async () => null;
        const resNoSwap = createMockRes();
        await userController.rateUser(
            { user: { _id: reviewerId }, params: { id: targetId }, body: { rating: 5, review: 'Great' } },
            resNoSwap
        );
        assert.equal(resNoSwap.statusCode, 403);
    });

    it('acceptSwapRequest blocks non-recipients and non-pending requests', async () => {
        const senderId = new mongoose.Types.ObjectId();
        const recipientId = new mongoose.Types.ObjectId();

        SkillSwap.findById = async () => ({
            _id: 'swap1',
            fromUser: senderId,
            toUser: recipientId,
            status: 'pending'
        });

        await assert.rejects(
            () => skillSwapService.acceptSwapRequest('swap1', senderId),
            (err) => err.status === 403
        );
    });

    it('completeSwap blocks non-participants and double completion', async () => {
        const fromId = new mongoose.Types.ObjectId();
        const toId = new mongoose.Types.ObjectId();
        const strangerId = new mongoose.Types.ObjectId();

        SkillSwap.findById = async () => ({
            _id: 'swap1',
            fromUser: fromId,
            toUser: toId,
            status: 'completed'
        });

        await assert.rejects(
            () => skillSwapService.completeSwap('swap1', strangerId),
            (err) => err.status === 403
        );
        await assert.rejects(
            () => skillSwapService.completeSwap('swap1', fromId),
            (err) => err.status === 400
        );
    });

    it('deleteSkill checks ownership before deleting', async () => {
        let capturedFilter = null;
        Skills.findOneAndDelete = async (filter) => {
            capturedFilter = filter;
            return null;
        };

        const deleted = await skillsService.deleteSkill('skill123', 'owner456');
        assert.equal(deleted, null);
        assert.deepEqual(capturedFilter, { _id: 'skill123', user: 'owner456' });
    });
});

describe('AI Curriculum & Matching Engine', () => {
    it('generateCurriculum fallback matches frontend schema (title, summary, weeks with learn/teach/exercise)', async () => {
        const prevGeminiKey = process.env.GEMINI_API_KEY;
        delete process.env.GEMINI_API_KEY;
        try {
            const plan = await aiService.generateCurriculum({
                skillToLearn: 'TypeScript',
                skillToTeach: 'Spanish',
                partnerName: 'Sofia'
            });
            assert.equal(plan.isFallback, true);
            assert.ok(typeof plan.title === 'string' && plan.title.length > 0);
            assert.ok(typeof plan.summary === 'string' && plan.summary.length > 0);
            assert.equal(plan.weeks.length, 4);
            assert.ok(plan.weeks[0].learnTopic);
            assert.ok(plan.weeks[0].teachTopic);
            assert.ok(plan.weeks[0].milestoneExercise);
        } finally {
            if (prevGeminiKey !== undefined) {
                process.env.GEMINI_API_KEY = prevGeminiKey;
            }
        }
    });

    it('extractUserDomainVector recognizes multi-word keywords in skillsNeeded', () => {
        const vec = matchingService.extractUserDomainVector({
            role: '',
            bio: '',
            skillsOffered: [],
            skillsNeeded: ['System Design']
        });
        assert.ok(vec.software_cloud >= 2);
    });
});
