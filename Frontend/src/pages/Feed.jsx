import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  Send,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { feedService } from '../services/feedService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data } = await feedService.getAllPosts();
      setPosts(data.posts);
    } catch (error) {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleComment = async (postId) => {
    try {
      const response = await feedService.commentPost(postId, newComment);
      if (response.status === 201) {
        fetchComments(postId);
        toast.success('Comment added successfully!');
        setNewComment('');
      }
      //setPosts(posts.map(p => p._id === postId ? { ...p, comments: [...p.comments, data.comment] } : p));
    } catch (error) {
      toast.error('Failed to comment on post');
    }
  };


  const fetchComments = async (postId) => {
    try {
      const { data } = await feedService.getComments(postId);
      setComments(data.comments);
    } catch (error) {
      toast.error('Failed to load comments');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent || !selectedFile) {
      return toast.error('Please provide both content and media');
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('content', newPostContent);
    formData.append('media', selectedFile);

    try {
      const { data } = await feedService.createPost(formData);
      setPosts([data.post, ...posts]);
      setIsUploadModalOpen(false);
      setNewPostContent('');
      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success('Post created successfully!');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const { data } = await feedService.likePost(postId);
      setPosts(posts.map(p => p._id === postId ? { ...p, likes: data.post.likes } : p));
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  if (!user) return <div className="container py-20 text-center">Please login to view the feed.</div>;

  return (
    <div className="container py-8 max-w-2xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">Community Feed</h1>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span>New Showcase</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-3xl h-96 border border-outline-variant"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map(post => {
            const isCommentsOpen = showComments && selectedPost === post._id;
            return (
              <div key={post._id} className={`bg-white rounded-[2.5rem] overflow-hidden border border-outline-variant shadow-sm hover:shadow-md transition-all duration-900 ${isCommentsOpen ? 'max-w-5xl -mx-4 md:-mx-32' : 'max-w-2xl mx-auto'}`}>
                <div className={`grid grid-cols-1 ${isCommentsOpen ? 'md:grid-cols-[1.2fr_0.8fr]' : 'grid-cols-1'}`}>
                  {/* Left Side: Post Content */}
                  <div className="flex flex-col border-r border-outline-variant/10">
                    {/* Post Header */}
                    <div className="p-4 px-6 flex items-center justify-between">
                      <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => navigate(`/profile/${post.user?._id}`)}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container ring-2 ring-transparent group-hover:ring-primary transition-all">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.fullname?.firstname}`} alt="" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{post.user?.fullname?.firstname} {post.user?.fullname?.lastname}</h3>
                          <p className="text-[10px] text-on-surface-variant font-medium">{post.user?.role}</p>
                        </div>
                      </div>
                      <button className="text-on-surface-variant hover:text-on-surface p-2">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>

                    {/* Post Media */}
                    <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
                      {post.mediaType === 'video' ? (
                        <video src={post.mediaUrl} controls className="max-h-full w-full" />
                      ) : (
                        <img src={post.mediaUrl} alt="" className="max-h-full w-full object-cover" />
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="p-6">
                      <p className="text-on-surface mb-6 font-medium leading-relaxed">
                        {post.content}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
                        <div className="flex items-center gap-6">
                          <button
                            onClick={() => handleLike(post._id)}
                            className={`flex items-center gap-2 transition-colors ${post.likes.includes(user._id) ? 'text-error' : 'text-on-surface-variant hover:text-error'}`}
                          >
                            <Heart size={22} fill={post.likes.includes(user._id) ? 'currentColor' : 'none'} />
                            <span className="text-sm font-bold">{post.likes.length}</span>
                          </button>
                          <button className={`flex items-center gap-2 transition-colors ${isCommentsOpen ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                            onClick={() => {
                              if (isCommentsOpen) {
                                setShowComments(false);
                                setSelectedPost(null);
                              } else {
                                fetchComments(post._id);
                                setSelectedPost(post._id);
                                setShowComments(true);
                              }
                            }}>
                            <MessageCircle size={22} />
                            <span className="text-sm font-bold">Comments</span>
                          </button>
                        </div>
                        <button className="text-on-surface-variant hover:text-primary transition-colors">
                          <Share2 size={22} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Comments (Visible only when open) */}
                  {isCommentsOpen && (
                    <div className="flex flex-col h-[500px] md:h-auto bg-surface-container-lowest/50 animate-in slide-in-from-right duration-900">
                      <div className="p-6 flex-grow flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-bold text-lg">Comments</h4>
                          <button onClick={() => setShowComments(false)} className="md:hidden p-2 hover:bg-surface-container rounded-full">
                            <X size={18} />
                          </button>
                        </div>

                        {/* Comment List */}
                        <div className="flex-grow overflow-y-auto pr-2 space-y-6 no-scrollbar">
                          {comments?.map((comment) => (
                            <div key={comment._id} className="group flex gap-3 items-start">
                              <div className="flex-shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container ring-1 ring-outline-variant/10">
                                  <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.fullname?.firstname}`}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="flex items-center gap-2 mb-1 cursor-pointer hover:text-primary transition-colors inline-flex"
                                  onClick={() => navigate(`/profile/${comment.user?._id}`)}
                                >
                                  <span className="font-bold text-xs">{comment.user?.fullname?.firstname}</span>
                                  <span className="text-[10px] text-on-surface-variant/60">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="bg-white border border-outline-variant/30 rounded-2xl rounded-tl-none p-3 shadow-sm">
                                  <p className="text-xs text-on-surface leading-normal">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {comments.length === 0 && (
                            <div className="text-center py-10">
                              <p className="text-xs text-on-surface-variant italic">No comments yet. Be the first to chime in!</p>
                            </div>
                          )}
                        </div>

                        {/* Comment Input */}
                        <div className="mt-6 pt-4 border-t border-outline-variant/30">
                          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-outline-variant/50 focus-within:border-primary/30 transition-all">
                            <input
                              type="text"
                              placeholder="Add a comment..."
                              className="flex-grow p-2 text-xs bg-transparent border-none outline-none"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleComment(post._id)}
                            />
                            <button
                              onClick={() => handleComment(post._id)}
                              disabled={!newComment.trim()}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-30"
                            >
                              <Send size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {posts.length === 0 && (
            <div className="text-center py-20 bg-surface-container-low rounded-[3rem] border border-dashed border-outline-variant">
              <p className="text-on-surface-variant">No showcases yet. Be the first to share your skills!</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Showcase</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider ml-1">Caption</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's the skill you're showcasing today?"
                  className="w-full p-4 rounded-2xl bg-surface-container-low border-none outline-none focus:ring-2 ring-primary/20 transition-all resize-none h-24"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider ml-1">Media</label>
                {!previewUrl ? (
                  <div className="border-2 border-dashed border-outline-variant rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:bg-surface-container-low transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,video/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <ImageIcon size={24} />
                    </div>
                    <p className="text-sm font-medium text-on-surface-variant">Click to upload photo or video</p>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-black group">
                    {selectedFile.type.startsWith('video') ? (
                      <video src={previewUrl} className="w-full h-full object-contain" />
                    ) : (
                      <img src={previewUrl} className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                      className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading || !newPostContent || !selectedFile}
                className="btn btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? 'Creating Post...' : (
                  <>
                    <Send size={20} />
                    <span>Post Showcase</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {/* {comment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6">
              <h3 className="text-2xl font-bold gradient-text mb-6">Comment on Post</h3>
              <form onSubmit={handleComment}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider ml-1">Comment</label>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full rounded-2xl p-4 bg-surface-container-high border border-outline-variant focus:border-primary focus:outline-none transition-colors h-32 resize-none"
                      required
                    />
                  </div>
                  <button
                    onClick={handleComment}
                    disabled={commenting || !newComment}
                    className="btn btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {commenting ? 'Commenting...' : (
                      <>
                        <Send size={20} />
                        <span>Post Comment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Feed;
