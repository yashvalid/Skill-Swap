import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  MapPin,
  CheckCircle2,
  Clock,
  MessageSquare,
  Zap,
  Share2,
  Award,
  Video
} from 'lucide-react';
import { userService } from '../services/userService';
import { feedService } from '../services/feedService';
import { skillService } from '../services/skillService';
import { swapService } from '../services/swapService';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useVideoCall } from '../context/VideoCallContext';

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
  const [review, setReview] = useState('');
  const [hasConnection, setHasConnection] = useState(false);

  useEffect(() => {
    if (id) {
      if (currentUser && currentUser._id === id) {
        navigate('/profile');
        return;
      }
      fetchUserData();
      checkConnection();
    }
  }, [id]);

  const fetchUserData = async () => {
    try {
      const [userRes, postsRes] = await Promise.all([
        userService.getUserById(id),
        feedService.getUserPosts(id)
      ]);

      setProfileUser(userRes.data.user);
      setPosts(postsRes.data.posts);
      setOfferedSkills(userRes.data.user.skillsOffered || []);
      setSkillsToLearn(userRes.data.user.skillsNeeded || []);
    } catch (error) {
      console.error('Failed to fetch user data', error);
      toast.error('Failed to load profile');
    }
  };

  const checkConnection = async () => {
    try {
      const res = await swapService.getAcceptedSwaps();
      // Check if there is an accepted swap with this user
      const connectedUsers = res.data.allUsers || [];
      const connected = connectedUsers.some(s =>
        s.otherUser._id === id
      );
      setHasConnection(connected);
    } catch (error) {
      console.error('Error checking connection', error);
    }
  };

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    try {
      await userService.rateUser(id, { rating, review });
      toast.success('Rating submitted successfully!');
      setShowRatingModal(false);
      fetchUserData(); // refresh rating
    } catch (error) {
      toast.error('Failed to submit rating');
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied!');
  };

  if (!profileUser) return <div className="container py-20 text-center">Loading...</div>;

  return (
    <div className="container py-16">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-12 items-start mb-16">
        <div className="relative group">
          <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl relative z-10 bg-surface-container">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.fullname?.firstname}`}
              alt={profileUser.fullname?.firstname}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-white z-20 shadow-lg">
            <CheckCircle2 size={24} />
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-[3rem] -rotate-6 scale-105 z-0 transition-transform group-hover:rotate-0"></div>
        </div>

        <div className="flex-grow pt-4">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
                {profileUser.fullname?.firstname} {profileUser.fullname?.lastname}
                {profileUser.averageRating >= 4.5 && profileUser.totalRatings > 0 && (
                  <span className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                    <Award size={14} /> Top Rated
                  </span>
                )}
              </h1>
            </div>
            <div className="flex items-center gap-1 bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-bold">
              <Star size={14} fill="currentColor" />
              {profileUser.averageRating?.toFixed(1) || '0.0'} ({profileUser.totalRatings || 0} reviews)
            </div>
          </div>
          <p className="text-xl text-primary font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>{profileUser.role}</p>
          <div className="flex flex-wrap gap-6 text-on-surface-variant mb-8">
            <span className="flex items-center gap-2"><MapPin size={18} /> {profileUser.location}</span>
          </div>
          <div className="flex gap-4">
            {hasConnection && (
              <button
                onClick={() => startCall(profileUser)}
                className="btn btn-primary px-8 flex items-center gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-md shadow-primary/20"
              >
                <Video size={18} className="animate-pulse" /> Start Video Call
              </button>
            )}
            <button
              onClick={() => navigate('/messages')}
              className={`btn ${hasConnection ? 'btn-outline' : 'btn-primary'} px-8 flex items-center gap-2`}
            >
              <MessageSquare size={18} /> Message
            </button>
            {hasConnection && (
              <button
                onClick={() => setShowRatingModal(true)}
                className="btn btn-outline px-8 flex items-center gap-2"
              >
                <Star size={18} /> Rate User
              </button>
            )}
            <button
              onClick={handleShareProfile}
              className="btn btn-outline px-4 flex items-center gap-2"
              title="Share Profile"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
        <div className="md:col-span-2 space-y-16">
          <section>
            <h2 className="headline-sm mb-6">About {profileUser.fullname?.firstname}</h2>
            <p className="text-lg text-on-surface-variant leading-relaxed text-pretty">
              {profileUser.bio}
            </p>
          </section>

          <section>
            <h2 className="headline-sm mb-6">Posts</h2>
            <div className="space-y-6">
              {posts.map(post => (
                <div key={post._id} className="bg-surface-container rounded-3xl p-6 shadow-sm border border-outline-variant/30">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.fullname?.firstname}`}
                      className="w-12 h-12 rounded-full bg-white border-2 border-primary/20"
                      alt="avatar"
                    />
                    <div>
                      <h3 className="font-bold">{profileUser.fullname?.firstname} {profileUser.fullname?.lastname}</h3>
                      <p className="text-sm text-on-surface-variant">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="mb-4 text-on-surface-variant whitespace-pre-wrap">{post.content}</p>
                  {post.mediaUrl && (
                    <div className="rounded-2xl overflow-hidden mb-4 border border-outline-variant/20 bg-black/5">
                      {post.mediaType === 'video' ? (
                        <video src={post.mediaUrl} controls className="w-full max-h-96 object-cover" />
                      ) : (
                        <img src={post.mediaUrl} alt="Post content" className="w-full max-h-96 object-cover" />
                      )}
                    </div>
                  )}
                </div>
              ))}
              {posts.length === 0 && <p className="text-on-surface-variant text-sm italic">No posts yet.</p>}
            </div>
          </section>

          <section>
            <h2 className="headline-sm mb-6">Reviews</h2>
            <div className="space-y-4">
              {profileUser.ratings?.map((r, i) => (
                <div key={i} className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold">{r.user?.fullname?.firstname || 'User'}</p>
                    <div className="flex text-secondary">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={14} fill={j < r.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-sm">{r.review}</p>
                </div>
              ))}
              {(!profileUser.ratings || profileUser.ratings.length === 0) && (
                <p className="text-on-surface-variant text-sm italic">No reviews yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <h2 className="headline-sm mb-6">Rate {profileUser.fullname?.firstname}</h2>
            <form onSubmit={handleRateSubmit} className="space-y-4">
              <div>
                <label className="label-md mb-2 block font-bold">Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="label-md mb-2 block font-bold">Review</label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 ring-primary/20 outline-none min-h-[100px]"
                ></textarea>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setShowRatingModal(false)} className="flex-1 btn btn-outline py-3 justify-center">
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary py-3 justify-center">
                  Submit
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
