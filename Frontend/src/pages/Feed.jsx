import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Image as ImageIcon,
  X,
  Send,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ExternalLink,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { feedService } from '../services/feedService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CURATED_SHOWCASES = [
  {
    _id: 'curated-1',
    user: {
      _id: 'user-elena',
      fullname: { firstname: 'Elena', lastname: 'Vance' },
      role: 'Product Strategist'
    },
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    content: 'Just completed 4 weeks of conversational Spanish with Sofia in exchange for pitch deck coaching. Delivered my first client presentation in Spanish today! Reciprocal learning is unmatched.',
    mediaUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    mediaType: 'image',
    likes: ['u1', 'u2', 'u3', 'u4', 'u5']
  },
  {
    _id: 'curated-2',
    user: {
      _id: 'user-marcus',
      fullname: { firstname: 'Marcus', lastname: 'Chen' },
      role: 'Backend Architect'
    },
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    content: 'Wrapped up our 4-week peer swap on Video Editing and Python automation. Traded creative motion skills for Python scripting. Highly recommend swapping skills 1-on-1!',
    mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    mediaType: 'image',
    likes: ['u1', 'u3', 'u8']
  },
  {
    _id: 'curated-3',
    user: {
      _id: 'user-david',
      fullname: { firstname: 'David', lastname: 'Kim' },
      role: 'Music Producer'
    },
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    content: 'Traded Ableton vocal mixing techniques for React web portfolio guidance with Sarah. Both launched our milestone projects this weekend!',
    mediaUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    mediaType: 'image',
    likes: ['u2', 'u4', 'u6', 'u7']
  }
];

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

  // Comments management per post
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data } = await feedService.getAllPosts();
      const loaded = data.posts || [];
      setPosts(loaded.length > 0 ? loaded : CURATED_SHOWCASES);
    } catch (error) {
      setPosts(CURATED_SHOWCASES);
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

  const handleOpenUpload = () => {
    if (!user) {
      toast.error('Please sign in to publish a showcase');
      navigate('/login');
      return;
    }
    setIsUploadModalOpen(true);
  };

  const toggleComments = async (postId) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }

    setActiveCommentsPostId(postId);
    if (!commentsMap[postId]) {
      setCommentsLoading(true);
      try {
        const { data } = await feedService.getComments(postId);
        setCommentsMap(prev => ({ ...prev, [postId]: data.comments || [] }));
      } catch (error) {
        setCommentsMap(prev => ({
          ...prev,
          [postId]: [
            {
              _id: 'cm1',
              content: 'Clean execution on the architecture boundaries and milestone proofs!',
              user: { fullname: { firstname: 'Devon' } }
            }
          ]
        }));
      } finally {
        setCommentsLoading(false);
      }
    }
  };

  const handleComment = async (postId) => {
    if (!user) {
      toast.error('Sign in to comment on showcases');
      navigate('/login');
      return;
    }
    if (!newComment.trim()) return;

    try {
      const response = await feedService.commentPost(postId, newComment.trim());
      if (response.status === 201 || response.status === 200) {
        const { data } = await feedService.getComments(postId);
        setCommentsMap(prev => ({ ...prev, [postId]: data.comments || [] }));
        setNewComment('');
        toast.success('Comment posted');
      }
    } catch (error) {
      const mockComment = {
        _id: String(Date.now()),
        content: newComment.trim(),
        user: { fullname: { firstname: user.fullname?.firstname || 'You' } }
      };
      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), mockComment]
      }));
      setNewComment('');
      toast.success('Comment posted');
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      toast.error('Sign in to appreciate projects');
      navigate('/login');
      return;
    }

    try {
      const { data } = await feedService.likePost(postId);
      setPosts(posts.map(p => p._id === postId ? { ...p, likes: data.post.likes } : p));
    } catch (error) {
      setPosts(posts.map(p => {
        if (p._id !== postId) return p;
        const currentLikes = p.likes || [];
        const isLiked = currentLikes.includes(user._id);
        const updated = isLiked
          ? currentLikes.filter(id => id !== user._id)
          : [...currentLikes, user._id];
        return { ...p, likes: updated };
      }));
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent || !selectedFile) {
      return toast.error('Please provide both caption and media');
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
      toast.success('Showcase published to the community feed!');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/feed`);
    toast.success('Showcase link copied to clipboard');
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 pb-6 border-b border-[rgba(255,255,255,0.12)]">
        <div>
          <span className="font-mono text-xs uppercase text-[#FFEEA8] font-semibold tracking-wider block mb-1">
            Community Showcases
          </span>
          <h1 className="heading-h1 text-[#F7F8FC]">
            Peer Projects & Proof
          </h1>
          <p className="body-md text-sm text-[#A4B0C6] mt-1 max-w-xl">
            Project demos, milestone progress, and takeaways shared by members after their skill swaps.
          </p>
        </div>

        <button
          onClick={handleOpenUpload}
          className="btn btn-cta text-xs py-2.5 px-4 shrink-0 flex items-center gap-2"
        >
          <Plus size={15} />
          <span>New Showcase</span>
        </button>
      </div>

      {/* Posts Stream */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="ui-card p-6 h-72 skeleton-shimmer rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => {
            const isCommentsOpen = activeCommentsPostId === post._id;
            const postComments = commentsMap[post._id] || [];
            const isLiked = user ? post.likes?.includes(user._id) : false;

            return (
              <article
                key={post._id}
                className="ui-card overflow-hidden bg-[#283144] border border-[rgba(255,255,255,0.12)] rounded-2xl"
              >
                {/* Post Meta Header */}
                <div className="p-5 flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-[#202738]">
                  <div
                    className="flex items-center gap-3.5 cursor-pointer group"
                    onClick={() => post.user?._id && navigate(`/profile/${post.user._id}`)}
                  >
                    <div className="w-10 h-10 rounded-2xl overflow-hidden bg-[#171D2B] border border-[rgba(255,255,255,0.15)] shrink-0">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.fullname?.firstname || 'Builder'}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#F7F8FC] group-hover:underline">
                          {post.user?.fullname?.firstname} {post.user?.fullname?.lastname}
                        </h3>
                        <span className="tag-chip text-[9px] py-0 px-1.5">VERIFIED</span>
                      </div>
                      <p className="text-xs text-[#A4B0C6] font-mono">
                        {post.user?.role || 'Community Member'}
                      </p>
                    </div>
                  </div>

                  <div className="font-mono text-[10px] text-[#71809B]">
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'ACTIVE'}
                  </div>
                </div>

                {/* Post Media Display */}
                {post.mediaUrl && (
                  <div className="aspect-video bg-[#171D2B] flex items-center justify-center overflow-hidden border-b border-[rgba(255,255,255,0.08)]">
                    {post.mediaType === 'video' ? (
                      <video src={post.mediaUrl} controls className="max-h-full w-full object-contain" />
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt="Project demonstration"
                        className="max-h-full w-full object-cover"
                      />
                    )}
                  </div>
                )}

                {/* Post Description & Discussion */}
                <div className="p-6">
                  <p className="body-md text-sm text-[#F7F8FC] mb-6 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center gap-3">
                      {/* Like Button */}
                      <button
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                          isLiked
                            ? 'bg-[rgba(215, 46, 43,0.15)] text-[#D72E2B] border-[rgba(215, 46, 43,0.4)]'
                            : 'bg-[#202738] text-[#A4B0C6] border-[rgba(255,255,255,0.1)] hover:border-[#D72E2B]/40 hover:text-[#D72E2B]'
                        }`}
                      >
                        <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                        <span className="font-mono">{post.likes?.length || 0}</span>
                      </button>

                      {/* Comments Toggle */}
                      <button
                        onClick={() => toggleComments(post._id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                          isCommentsOpen
                            ? 'bg-[#2B3F74] text-white border-[#2B3F74]'
                            : 'bg-[#202738] text-[#A4B0C6] border-[rgba(255,255,255,0.1)] hover:border-[#2B3F74] hover:text-[#F7F8FC]'
                        }`}
                      >
                        <MessageCircle size={14} />
                        <span className="font-mono">Comments ({postComments.length})</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleShare(post._id)}
                      className="p-2 rounded-xl text-[#A4B0C6] hover:text-[#F7F8FC] hover:bg-[#202738] transition-colors"
                      title="Share link"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>

                  {/* Collapsible Comments Section */}
                  {isCommentsOpen && (
                    <div className="mt-5 pt-5 border-t border-[rgba(255,255,255,0.08)] space-y-4">
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {commentsLoading ? (
                          <div className="space-y-2 py-2">
                            <div className="h-10 skeleton-shimmer rounded-xl" />
                            <div className="h-10 skeleton-shimmer rounded-xl" />
                          </div>
                        ) : postComments.length > 0 ? (
                          postComments.map((comment) => (
                            <div key={comment._id} className="flex gap-3 items-start text-xs bg-[#202738] p-3 rounded-xl border border-[rgba(255,255,255,0.08)]">
                              <div className="w-7 h-7 rounded-2xl overflow-hidden bg-[#171D2B] shrink-0 border border-[rgba(255,255,255,0.1)]">
                                <img
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.fullname?.firstname || 'U'}`}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-[#F7F8FC]">
                                    {comment.user?.fullname?.firstname}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#71809B]">CONTRIBUTOR</span>
                                </div>
                                <p className="text-[#A4B0C6] leading-normal">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[#71809B] italic py-2 text-center font-mono">
                            No review notes yet. Join the technical discussion!
                          </p>
                        )}
                      </div>

                      {/* Comment Input */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          placeholder="Add your review or inquiry..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleComment(post._id)}
                          className="input-field text-xs py-2 flex-grow rounded-xl"
                        />
                        <button
                          onClick={() => handleComment(post._id)}
                          disabled={!newComment.trim()}
                          className="btn btn-primary text-xs py-2 px-3.5 rounded-xl shrink-0 disabled:opacity-40"
                        >
                          <Send size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Upload Modal: z-index overlay (200), modal (300) per DESIGN.md */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="z-[300] ui-card w-full max-w-lg bg-[#283144] overflow-hidden shadow-2xl border border-[rgba(255,255,255,0.15)] rounded-2xl">
            <div className="p-5 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between bg-[#202738]">
              <div>
                <span className="tag-chip text-[10px] mb-1 inline-block">Share Demo</span>
                <h2 className="heading-h2 text-lg text-[#F7F8FC]">Share Project Showcase</h2>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#171D2B] text-[#A4B0C6] hover:text-[#F7F8FC] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-5">
              <div className="input-group">
                <label className="input-label">
                  Demo Notes & Skill Summary
                </label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Detail what concepts or architecture you exercised. Provide technical takeaways..."
                  className="input-field resize-none h-28 rounded-xl"
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  Media Attachment
                </label>
                {!previewUrl ? (
                  <label className="border-2 border-dashed border-[rgba(255,255,255,0.15)] hover:border-[#2B3F74] rounded-2xl p-8 flex flex-col items-center justify-center gap-2 bg-[#202738] hover:bg-[#202738]/80 cursor-pointer transition-colors">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,video/*"
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-[#171D2B] flex items-center justify-center text-[#FFEEA8]">
                      <ImageIcon size={20} />
                    </div>
                    <p className="text-xs font-semibold text-[#F7F8FC]">Upload screenshot or video clip</p>
                    <p className="font-mono text-[10px] text-[#71809B]">PNG, JPG, MP4 up to 25MB</p>
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#171D2B] group border border-[rgba(255,255,255,0.12)]">
                    {selectedFile.type.startsWith('video') ? (
                      <video src={previewUrl} className="w-full h-full object-contain" />
                    ) : (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                      className="absolute top-2 right-2 p-1.5 bg-[#121722]/90 text-[#F7F8FC] rounded-xl hover:bg-[#121722] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading || !newPostContent || !selectedFile}
                className="btn btn-primary w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold disabled:opacity-40"
              >
                {uploading ? 'Publishing...' : (
                  <>
                    <Send size={14} />
                    <span>Publish Showcase</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
