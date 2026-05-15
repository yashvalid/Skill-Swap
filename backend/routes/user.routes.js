const express = require('express');
const router = express.Router();
const User = require('../model/user.model');
const { body } = require('express-validator');
const userController = require('../controllers/user.controllers');
const authMiddleware = require('../middlewares/authentication');

router.post('/register',
    body('fullname.firstname').notEmpty().withMessage('First name is required'),
    body('email').isEmail().withMessage('Email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isLength({ min: 3 }).withMessage('role is required'),
    body('location').isLength({ min: 3 }).withMessage('location is required'),
    body('bio').isLength({ min: 3 }).withMessage('bio is required'),
    userController.registerUser
)

router.post('/login',
    body('email').isEmail().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    userController.userLogin
)

router.get('/profile',
    authMiddleware.authUser,
    userController.getUserProfile
)

router.get('/all-users',
    authMiddleware.authUser,
    userController.getAllUsers
)

router.get('/:id',
    authMiddleware.authUser,
    userController.getUserById
)

router.put('/update-profile',
    authMiddleware.authUser,
    userController.updateProfile
)

router.post('/rate/:id',
    authMiddleware.authUser,
    body('rating').isNumeric().withMessage('Rating is required and must be a number'),
    userController.rateUser
)

module.exports = router;