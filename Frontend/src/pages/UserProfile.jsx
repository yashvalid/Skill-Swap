import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  MapPin,
  CheckCircle2,
  MessageSquare,
  Share2,
  Award,
  Video,
  X,
  ShieldCheck,
  ArrowRight,
  ArrowLeftRight
} from 'lucide-react';
import { userService } from '../services/userService';
import { feedService } from '../services/feedService';
import { swapService } from '../services/swapService';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useVideoCall } from '../context/VideoCallContext';

const CURATED_FALLBACK_PEERS = {
  'peer-1': {
    _id: 'peer-1',
    fullname: { firstname: 'Sarah', lastname: 'Lin' },
    role: 'Lead Design Systems Engineer',
    bio: 'Crafting production token systems, component libraries, and spatial micro-interactions in Figma and React.',
    location: 'San Francisco, CA',
    skillsOffered: ['Figma Variables', 'Design Tokens', 'Tailwind CSS', 'Accessibility'],
    skillsNeeded: ['Next.js 15', 'TypeScript', 'State Machines'],
    averageRating: 4.95,
    totalRatings: 34
  },
  'peer-2': {
    _id: 'peer-2',
    fullname: { firstname: 'Marcus', lastname: 'Thorne' },
    role: 'Principal Backend Architect',
    bio: 'Specializing in high-throughput distributed systems, WebSocket protocols, and cloud event pipelines.',
    location: 'Berlin / Remote',
    skillsOffered: ['Distributed Systems', 'Redis Architecture', 'Node.js Internals', 'Docker'],
    skillsNeeded: ['Product UI', 'SwiftUI', 'Animation Curves'],
    averageRating: 4.9,
    totalRatings: 48
  },
  'peer-3': {
    _id: 'peer-3',
    fullname: { firstname: 'Elena', lastname: 'Vance' },
    role: 'Staff Product Strategist',
    bio: 'Helping technical founders and builders shape product narratives, user retention loops, and UX research.',
    location: 'New York, NY',
    skillsOffered: ['Product Strategy', 'UX Architecture', 'Growth Loops', 'User Research'],
    skillsNeeded: ['React Basics', 'Full-Stack Development', 'API Design'],
    averageRating: 5.0,
    totalRatings: 62
  }
};

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { startCall } = useVideoCall();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [offeredSkills, setOfferedSkills] = useState([]);
  const [skillsToLearn, setSkillsToLearn] = useState([]);

  // Rating state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [hasConnection, setHasConnection] = useState(false);

  useEffect(() => {
    if (id) {
      if (currentUser && currentUser._id === id) {
        navigate('/profile');
        return;
      }
      fetchUserData();
      if (currentUser) {
        checkConnection();
      }
    }
  }, [id, currentUser]);

  const fetchUserData = async () => {
    if (CURATED_FALLBACK_PEERS[id]) {
      const mock = CURATED_FALLBACK_PEERS[id];
      setProfileUser(mock);
      setOfferedSkills(mock.skillsOffered || []);
      setSkillsToLearn(mock.skillsNeeded || []);
      return;
    }

    try {
      const userRes = await userService.getUserById(id);
      if (userRes.data?.user) {
        setProfileUser(userRes.data.user);
        setOfferedSkills(userRes.data.user.skillsOffered || []);
        setSkillsToLearn(userRes.data.user.skillsNeeded || []);
      }
    } catch (error) {
      console.error('Failed to fetch user data', error);
      toast.error('Failed to load profile');
    }

    try {
      const postsRes = await feedService.getUserPosts(id);
      setPosts(postsRes.data?.posts || []);
    } catch (error) {
      setPosts([]);
    }
  };

  const checkConnection = async () => {
    try {
      const res = await swapService.getAcceptedSwaps();
      const connectedUsers = res.data.allUsers || [];
      const connected = connectedUsers.some(s => s.otherUser?._id === id);
      setHasConnection(connected);
    } catch (error) {
      console.error('Error checking connection', error);
    }
  };

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    try {
      await userService.rateUser(id, { rating, review });
      toast.success('Rating submitted successfully');
      setShowRatingModal(false);
      setReview('');
      fetchUserData();
    } catch (error) {
      toast.error('Failed to submit rating');
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile permalink copied');
  };

  const handleInitiateSwap = () => {
    if (!currentUser) {
      toast.error('Sign in to propose a skill exchange');
      navigate('/login');
      return;
    }
    navigate('/swap-flow', { state: { partner: profileUser } });
  };

  if (!profileUser) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="h-6 w-48 mx-auto skeleton-shimmer rounded-none" />
          <div className="h-28 w-full skeleton-shimmer rounded-none" />
          <p className="font-mono text-xs text-[#718093]">RETRIEVING PEER IDENTITY...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Profile Header Hero */}
      <div className="ui-card p-6 sm:p-8 mb-10 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-[rgba(255,255,255,0.2)] bg-[#242A32] shadow-md">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.fullname?.firstname || 'User'}`}
                  alt={profileUser.fullname?.firstname}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#55E6C1] text-[#2F3640] rounded-none flex items-center justify-center font-bold shadow-md">
                <CheckCircle2 size={15} />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <h1 className="heading-h1 text-2xl sm:text-3xl text-[#F5F6FA]">
                  {profileUser.fullname?.firstname} {profileUser.fullname?.lastname}
                </h1>
                <span className="tag-chip text-[10px]">COMMUNITY MEMBER</span>
                <span className="tag-chip text-[10px] bg-[#2B313A] text-[#F5F6FA] border-[rgba(255,255,255,0.15)]">
                  <Star size={11} fill="currentColor" className="inline mr-1 text-[#FFA502]" />
                  {profileUser.averageRating?.toFixed(1) || '5.0'} RATING
                </span>
              </div>

              <p className="font-mono text-xs text-[#55E6C1] uppercase tracking-wider mb-2 font-semibold">
                {profileUser.role || 'Member'}
              </p>

              <div className="flex flex-wrap gap-4 text-xs text-[#A4B0BE] font-mono">
                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-[#6C5CE7]" /> {profileUser.location || 'Remote'}</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#55E6C1]" /> Identity Verified</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
            {hasConnection ? (
              <button
                onClick={() => startCall(profileUser)}
                className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5 rounded-none"
              >
                <Video size={14} />
                <span>Start Call</span>
              </button>
            ) : (
              <button
                onClick={handleInitiateSwap}
                className="btn btn-cta text-xs py-2 px-4 flex items-center gap-1.5 rounded-none"
              >
                <span>Propose Swap</span>
                <ArrowRight size={14} />
              </button>
            )}

            <button
              onClick={() => navigate('/messages')}
              className="btn btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 rounded-none"
            >
              <MessageSquare size={14} />
              <span>Message</span>
            </button>

            {hasConnection && (
              <button
                onClick={() => setShowRatingModal(true)}
                className="btn btn-secondary text-xs py-2 px-3 rounded-none"
              >
                <Star size={14} />
                <span>Rate</span>
              </button>
            )}

            <button
              onClick={handleShareProfile}
              className="btn btn-secondary text-xs p-2 rounded-none"
              title="Share Profile"
            >
              <Share2 size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* About Section */}
          <section className="ui-card p-6 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
            <div className="flex items-center justify-between mb-3 border-b border-[rgba(255,255,255,0.08)] pb-2">
              <h2 className="heading-h2 text-base text-[#F5F6FA]">About {profileUser.fullname?.firstname}</h2>
              <span className="font-mono text-[10px] text-[#718093]">SYNOPSIS</span>
            </div>
            <p className="body-md text-sm text-[#A4B0BE] leading-relaxed">
              {profileUser.bio || "Passionate about learning new skills, collaborating on projects, and sharing knowledge."}
            </p>
          </section>

          {/* Skills Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Offering Skills */}
            <div className="ui-card p-6 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(255,255,255,0.08)]">
                <div>
                  <span className="tag-chip text-[9px] mb-1 inline-block">OFFERING</span>
                  <h3 className="heading-h2 text-sm text-[#F5F6FA]">Teaches</h3>
                </div>
                <span className="font-mono text-xs font-semibold text-[#55E6C1]">
                  {offeredSkills.length} Skills
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {offeredSkills.map((sk, i) => (
                  <span key={i} className="tag-chip text-[11px]">
                    {sk}
                  </span>
                ))}
                {offeredSkills.length === 0 && (
                  <p className="text-xs text-[#718093] italic py-2 font-mono">No skills registered yet.</p>
                )}
              </div>
            </div>

            {/* Seeking Skills */}
            <div className="ui-card p-6 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(255,255,255,0.08)]">
                <div>
                  <span className="tag-chip text-[9px] mb-1 inline-block">SEEKING</span>
                  <h3 className="heading-h2 text-sm text-[#F5F6FA]">Wants to Learn</h3>
                </div>
                <span className="font-mono text-xs font-semibold text-[#55E6C1]">
                  {skillsToLearn.length} Targets
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillsToLearn.map((sk, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-xl bg-[#242A32] border border-[rgba(255,255,255,0.1)] text-xs text-[#A4B0BE] font-mono">
                    {sk}
                  </span>
                ))}
                {skillsToLearn.length === 0 && (
                  <p className="text-xs text-[#718093] italic py-2 font-mono">Open to all technical exchanges.</p>
                )}
              </div>
            </div>
          </section>

          {/* Showcases */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="heading-h2 text-base text-[#F5F6FA]">Portfolio Showcases ({posts.length})</h2>
              <span className="font-mono text-[10px] text-[#718093]">ARTIFACTS</span>
            </div>

            <div className="space-y-4">
              {posts.map(post => (
                <div key={post._id} className="ui-card p-5 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
                  <p className="font-mono text-[10px] text-[#718093] mb-2">
                    Posted on {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                  <p className="body-md text-sm text-[#F5F6FA] mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>

                  {post.mediaUrl && (
                    <div className="rounded-2xl overflow-hidden aspect-video bg-[#242A32] max-h-64 border border-[rgba(255,255,255,0.08)]">
                      {post.mediaType === 'video' ? (
                        <video src={post.mediaUrl} controls className="w-full h-full object-contain" />
                      ) : (
                        <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                </div>
              ))}

              {posts.length === 0 && (
                <div className="p-8 text-center ui-card bg-[#2B313A] border-dashed border-[rgba(255,255,255,0.15)] rounded-none">
                  <p className="text-xs text-[#718093] font-mono">No showcases published yet.</p>
                </div>
              )}
            </div>
          </section>

          {/* Partner Reviews */}
          <section className="ui-card p-6 bg-[#353B48] border border-[rgba(255,255,255,0.12)] space-y-4 rounded-none">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
              <h2 className="heading-h2 text-base text-[#F5F6FA]">Peer Endorsements & Reviews</h2>
              <span className="font-mono text-[10px] text-[#718093]">PROOF OF EXCHANGE</span>
            </div>

            <div className="space-y-3">
              {profileUser.ratings?.map((r, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#2B313A] border border-[rgba(255,255,255,0.08)] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-[#F5F6FA]">{r.user?.fullname?.firstname || 'Verified Partner'}</span>
                    <div className="flex text-[#FFA502]">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={11} fill={j < r.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                  <p className="body-md text-xs text-[#A4B0BE]">{r.review}</p>
                </div>
              ))}
              {(!profileUser.ratings || profileUser.ratings.length === 0) && (
                <p className="text-xs text-[#718093] italic py-2 font-mono">No reviews recorded yet. Propose a swap to earn the first testimonial!</p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Standing */}
        <div className="space-y-6">
          <div className="ui-card p-6 bg-[#2B313A] border border-[rgba(255,255,255,0.12)] space-y-4 rounded-none">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
              <h3 className="heading-h2 text-xs text-[#F5F6FA] uppercase font-semibold">Swap Reviews</h3>
              <span className="tag-chip text-[9px]">ACTIVE</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-[#A4B0BE]">Response Time</span>
                <span className="font-mono font-bold text-[#55E6C1]">&lt; 2 hrs</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-[#A4B0BE]">Avg. Session Length</span>
                <span className="font-bold text-[#F5F6FA]">45 mins</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A4B0BE]">Connection Status</span>
                <span className="font-mono font-semibold text-[#55E6C1] text-[10px]">
                  {hasConnection ? 'MUTUAL PARTNER' : 'AVAILABLE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Rating Modal: z-index overlay (200), modal (300) per DESIGN.md */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="z-[300] ui-card rounded-2xl p-6 sm:p-7 w-full max-w-md bg-[#353B48] border border-[rgba(255,255,255,0.15)] shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[rgba(255,255,255,0.1)]">
              <div>
                <span className="tag-chip text-[9px] mb-1 inline-block">FEEDBACK</span>
                <h2 className="heading-h2 text-base text-[#F5F6FA]">Rate Swap Experience</h2>
              </div>
              <button onClick={() => setShowRatingModal(false)} className="p-1 rounded-none hover:bg-[#2B313A] text-[#A4B0BE] hover:text-[#F5F6FA]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRateSubmit} className="space-y-4">
              <div>
                <label className="input-label block mb-2 text-center">
                  Select Rating
                </label>
                <div className="flex justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-[#FFA502] hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    >
                      <Star
                        size={26}
                        fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">
                  Feedback & Notes
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  required
                  placeholder="Describe your session outcomes, mentoring clarity, and reciprocation..."
                  className="input-field min-h-[90px] resize-none rounded-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 btn btn-secondary py-2 justify-center text-xs rounded-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary py-2 justify-center text-xs font-semibold rounded-none"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
