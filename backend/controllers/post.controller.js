const mongoose = require('mongoose');
const { postModel, commentModel } = require('../model/post.model');
const SkillSwap = require('../model/skillSwap.model');
const User = require('../model/user.model');
const { cloudinary } = require('../config/cloudinary');
const { validationResult } = require('express-validator');
const { invalidateCache } = require('../middlewares/cache');

const SAFE_AUTHOR_FIELDS = 'fullname role isVerified totalRatings credits';

module.exports.createPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required' });
    }

    const { content } = req.body;
    const mediaUrl = req.file.path;
    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    const post = await postModel.create({
      user: req.user._id,
      content: content.trim(),
      mediaUrl,
      mediaType
    });

    const populatedPost = await post.populate('user', SAFE_AUTHOR_FIELDS);

    await invalidateCache('cache:/posts/all*');

    res.status(201).json({ post: populatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.getAllPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20)) : 0;

    let query = postModel.find()
      .populate('user', SAFE_AUTHOR_FIELDS)
      .sort({ createdAt: -1 });

    if (limit > 0) {
      query = query.skip((page - 1) * limit).limit(limit);
    }

    const [posts, commentCounts, completedSwapsCount, ratedUsers] = await Promise.all([
      query.lean(),
      commentModel.aggregate([
        { $group: { _id: '$post', count: { $sum: 1 } } }
      ]),
      SkillSwap.countDocuments({ status: 'completed' }),
      User.find({ totalRatings: { $gt: 0 } }).select('averageRating').lean()
    ]);

    const countMap = new Map(commentCounts.map(c => [c._id.toString(), c.count]));
    const enrichedPosts = posts.map(p => ({
      ...p,
      commentsCount: countMap.get(p._id.toString()) || 0
    }));

    const avgCommunityRating = ratedUsers.length > 0
      ? Number((ratedUsers.reduce((acc, u) => acc + (u.averageRating || 0), 0) / ratedUsers.length).toFixed(1))
      : null;

    res.status(200).json({
      posts: enrichedPosts,
      stats: {
        completedSwaps: completedSwapsCount,
        totalShowcases: enrichedPosts.length,
        averageRating: avgCommunityRating
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.likePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await postModel.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userIndex = post.likes.findIndex(id => id.toString() === req.user._id.toString());
    if (userIndex === -1) {
      post.likes.push(req.user._id);
    } else {
      post.likes.splice(userIndex, 1);
    }

    await post.save();
    await invalidateCache('cache:/posts/all*');

    res.status(200).json({ post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.commentPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (!mongoose.isValidObjectId(req.params.postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await postModel.findById(req.params.postId).select('_id');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const commentp = await commentModel.create({
      post: req.params.postId,
      user: req.user._id,
      content: req.body.comment.trim()
    });

    await invalidateCache('cache:/posts/all*');

    res.status(201).json({ comment: commentp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.getComments = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const comments = await commentModel.find({ post: req.params.postId })
      .populate('user', SAFE_AUTHOR_FIELDS)
      .sort({ createdAt: 1 });
    res.status(200).json({ comments: comments || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.getUserPosts = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const posts = await postModel.find({ user: req.params.userId })
      .populate('user', SAFE_AUTHOR_FIELDS)
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const extractCloudinaryPublicId = (mediaUrl) => {
  try {
    const match = mediaUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

module.exports.deletePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await postModel.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await postModel.findByIdAndDelete(req.params.postId);
    await commentModel.deleteMany({ post: req.params.postId });

    const publicId = extractCloudinaryPublicId(post.mediaUrl);
    if (publicId) {
      cloudinary.uploader.destroy(publicId, {
        resource_type: post.mediaType === 'video' ? 'video' : 'image'
      }).catch((err) => {
        console.warn('[Cloudinary] Cleanup skipped:', err.message);
      });
    }

    await invalidateCache('cache:/posts/all*');

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.updatePost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (!mongoose.isValidObjectId(req.params.postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await postModel.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this post' });
    }

    post.content = req.body.content.trim();
    await post.save();

    await invalidateCache('cache:/posts/all*');

    res.status(200).json({ post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};