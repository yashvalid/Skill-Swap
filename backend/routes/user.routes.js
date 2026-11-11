const express = require('express');
const router = express.Router();
const User = require('../model/user.model');
const { body } = require('express-validator');
const userController = require('../controllers/user.controllers');
const authMiddleware = require('../middlewares/authentication');
const { createRateLimiter } = require('../middlewares/rateLimit');

const loginRateLimit = createRateLimiter({
    prefix: 'auth-login',
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.ip || req.socket?.remoteAddress || 'anonymous',
    message: 'Too many login attempts. Please try again in a few minutes.'
});

const registerRateLimit = createRateLimiter({
    prefix: 'auth-register',
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.ip || req.socket?.remoteAddress || 'anonymous',
    message: 'Too many account creation attempts from this IP. Please try again later.'
});

router.post('/register',
    registerRateLimit,
    body('fullname.firstname').notEmpty().withMessage('First name is required'),
    body('email').isEmail().withMessage('Email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isLength({ min: 3 }).withMessage('role is required'),
    body('location').isLength({ min: 3 }).withMessage('location is required'),
    body('bio').isLength({ min: 3 }).withMessage('bio is required'),
    body('agreedToPrivacyPolicy')
        .custom((value, { req }) => value === true || value === 'true' || req.body.privacyPolicyAccepted === true || req.body.privacyPolicyAccepted === 'true')
        .withMessage('You must read and agree to the Privacy Policy to create an account'),
    userController.registerUser
);

router.post('/login',
    loginRateLimit,
    body('email').isEmail().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    userController.userLogin
);

router.post('/logout', userController.userLogout);

router.get('/profile',
    authMiddleware.authUser,
    userController.getUserProfile
);

router.get('/all-users',
    authMiddleware.optionalAuth,
    userController.getAllUsers
);

router.get('/ice-servers',
    authMiddleware.authUser,
    userController.getIceServers
);

router.get('/:id',
    authMiddleware.optionalAuth,
    userController.getUserById
);

router.put('/update-profile',
    authMiddleware.authUser,
    body('fullname.firstname').optional().isString().trim().isLength({ min: 1, max: 60 }).withMessage('First name must be 1 to 60 characters'),
    body('fullname.lastname').optional().isString().trim().isLength({ max: 60 }).withMessage('Last name must be at most 60 characters'),
    body('bio').optional().isString().isLength({ min: 3, max: 1000 }).withMessage('Bio must be at least 3 characters'),
    body('location').optional().isString().isLength({ min: 2, max: 120 }).withMessage('Location must be at least 2 characters'),
    body('role').optional().isString().isLength({ min: 2, max: 100 }).withMessage('Role must be at least 2 characters'),
    userController.updateProfile
);

router.delete('/account',
    authMiddleware.authUser,
    userController.deleteAccount
);

router.post('/rate/:id',
    authMiddleware.authUser,
    body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be a number between 1 and 5'),
    body('review').optional().isString().isLength({ max: 1000 }).withMessage('Review is too long'),
    userController.rateUser
);

module.exports = router;
