const express = require('express');
const {body, query} = require('express-validator');
const router = express.Router();
const skillSwapController = require('../controllers/skillSwap.controllers');
const authMiddleware = require('../middlewares/authentication');
const { cache } = require('../middlewares/cache');

router.post('/request-swap', 
    body('toUser').custom((val, { req }) => {
        if (!val && !req.body.toUserId) throw new Error('To user is required');
        return true;
    }),
    body('offersSkill').custom((val, { req }) => {
        if (!val && !req.body.skillOffered) throw new Error('Offers skill is required');
        return true;
    }),
    body('requestsSkill').custom((val, { req }) => {
        if (!val && !req.body.skillRequested) throw new Error('Requests skill is required');
        return true;
    }),
    authMiddleware.authUser,
    skillSwapController.requestSwap
)

router.get('/accept-request-swap',
    query('requestId').notEmpty().withMessage('Request ID is required'),
    authMiddleware.authUser,
    skillSwapController.acceptSwapRequest
)

router.post('/complete-swap',
    authMiddleware.authUser,
    skillSwapController.completeSwap
)

router.get('/reject-request-swap',
    query('requestId').notEmpty().withMessage('Request id is required'),
    authMiddleware.authUser,
    skillSwapController.rejectSwap,
)

router.post('/reschedule',
    authMiddleware.authUser,
    skillSwapController.rescheduleSwap
)

router.put('/workspace',
    authMiddleware.authUser,
    skillSwapController.updateSwapWorkspace
)

router.get('/accepted-swaps',
    authMiddleware.authUser,
    cache(300, (req) => `cache:swaps:accepted:${req.user._id}`),
    skillSwapController.getAllAcceptedSwaps,
)

router.get('/get-pending-swaps',
    authMiddleware.authUser,
    cache(300, (req) => `cache:swaps:pending:${req.user._id}`),
    skillSwapController.getPendingSwaps,
)

module.exports = router;
