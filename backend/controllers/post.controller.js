const { postModel, commentModel } = require('../model/post.model');
const { validationResult } = require('express-validator');
const { invalidateCache } = require('../middlewares/cache');

module.exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required' });
    }

    const { content } = req.body;
    const mediaUrl = req.file.path; // Cloudinary URL
    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    const post = await postModel.create({
      user: req.user._id,
      content,
      mediaUrl,
      mediaType
    });

    const populatedPost = await post.populate('user', 'fullname email role');

    // Invalidate the feed cache
    await invalidateCache('cache:/posts/all');

    res.status(201).json({ post: populatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await postModel.find()
      .populate('user', 'fullname email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.likePost = async (req, res, next) => {
  try {
    const post = await postModel.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userIndex = post.likes.indexOf(req.user._id);
    if (userIndex === -1) {
      post.likes.push(req.user._id);
    } else {
      post.likes.splice(userIndex, 1);
    }

    await post.save();

    // Invalidate the feed cache
    await invalidateCache('cache:/posts/all');

    res.status(200).json({ post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.commentPost = async (req, res, next) => {
  try {
    const post = await postModel.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    const commentp = await commentModel.create({
      post: req.params.postId,
      user: req.user._id,
      content: req.body.comment
    });

    await post.save();

    // Invalidate the feed cache
    await invalidateCache('cache:/posts/all');

    res.status(201).json({ comment: commentp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.getComments = async (req, res, next) => {
  try {
    const comments = await commentModel.find({ post: req.params.postId })
      .populate('user', 'fullname email role');
    if (!comments)
      return res.status(404).json({ message: 'Comments not found' });
    res.status(200).json({ comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.getUserPosts = async (req, res, next) => {
  try {
    const posts = await postModel.find({ user: req.params.userId })
      .populate('user', 'fullname email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.deletePost = async (req, res, next) => {
  try {
    const post = await postModel.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await postModel.findByIdAndDelete(req.params.postId);
    // Also delete comments
    await commentModel.deleteMany({ post: req.params.postId });

    await invalidateCache('cache:/posts/all');

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.updatePost = async (req, res, next) => {
  try {
    const post = await postModel.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this post' });
    }

    post.content = req.body.content || post.content;
    await post.save();

    await invalidateCache('cache:/posts/all');

    res.status(200).json({ post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};