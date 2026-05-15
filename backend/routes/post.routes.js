const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const upload = require('../middlewares/upload.middleware');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authentication');

const { cache } = require('../middlewares/cache');

router.post('/create',
  authMiddleware.authUser,
  upload.single('media'),
  body('content').isLength({ min: 1 }).withMessage('Content is required'),
  postController.createPost
);

router.get('/all',
  authMiddleware.authUser,
  cache(600), 
  postController.getAllPosts
);

router.post('/like/:postId',
  authMiddleware.authUser,
  postController.likePost
);

router.post('/comment/:postId',
  authMiddleware.authUser,
  body('comment').isLength({ min: 1 }).withMessage('Content is required'),
  postController.commentPost
);

router.get('/comments/:postId', authMiddleware.authUser, postController.getComments);

router.get('/user/:userId', authMiddleware.authUser, postController.getUserPosts);
router.delete('/:postId', authMiddleware.authUser, postController.deletePost);
router.put('/:postId', authMiddleware.authUser, body('content').isLength({ min: 1 }), postController.updatePost);

module.exports = router;
