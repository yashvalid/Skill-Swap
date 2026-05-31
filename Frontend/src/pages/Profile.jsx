import React, { useState, useEffect } from 'react';
import {
  Star,
  MapPin,
  Briefcase,
  X,
  ExternalLink,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  Plus,
  Trash2,
  Edit,
  Settings,
  Share2,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { skillService } from '../services/skillService';
import { feedService } from '../services/feedService';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [offeredSkills, setOfferedSkills] = useState([]);
  const [skillsToLearn, setSkillsToLearn] = useState([]);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ skill: '', des: '', type: 'offer' });
  const [posts, setPosts] = useState([]);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ bio: '', location: '' });

  const [showEditPost, setShowEditPost] = useState(false);
  const [editPostData, setEditPostData] = useState({ id: '', content: '' });

  useEffect(() => {
    if (user) {
      fetchSkills();
      fetchPosts();
      setEditProfileData({ bio: user.bio || '', location: user.location || '' });
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      const res = await feedService.getUserPosts(user._id);
      setPosts(res.data.posts);
    } catch (error) {
      console.error('Failed to fetch posts', error);
    }
  };

  const fetchSkills = async () => {
    try {
      // const [offeredRes, learnRes] = await Promise.all([
      //   skillService.getOfferedSkills(),
      //   skillService.getSkillsToLearn()
      // ]);
      const offeredRes = await skillService.getOfferedSkills();
      const learnRes = await skillService.getSkillsToLearn();

      setOfferedSkills(offeredRes.data.skills || []);
      setSkillsToLearn(learnRes.data.skills || []);
    } catch (error) {
      console.error('Failed to fetch skills', error);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    try {
      if (newSkill.type === 'offer') {
        await skillService.addOfferedSkill({ skill: newSkill.skill, des: newSkill.des });
      } else {
        await skillService.addSkillToLearn({ skill: newSkill.skill, des: newSkill.des });
      }
      toast.success('Skill added successfully');
      setNewSkill({ skill: '', des: '', type: 'offer' });
      setShowAddSkill(false);
      fetchSkills();
    } catch (error) {
      toast.error('Failed to add skill');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    try {
      await skillService.deleteSkill(skillId);
      toast.success('Skill deleted');
      fetchSkills();
    } catch (error) {
      toast.error('Failed to delete skill');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await userService.updateProfile(editProfileData);
      toast.success('Profile updated successfully, please refresh to see changes');
      setShowEditProfile(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await feedService.deletePost(postId);
      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleEditPostSubmit = async (e) => {
    e.preventDefault();
    try {
      await feedService.updatePost(editPostData.id, { content: editPostData.content });
      toast.success('Post updated');
      setShowEditPost(false);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const handleShareProfile = () => {
    const url = `${window.location.origin}/profile/${user._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied!');
  };

  if (!user) return <div className="container py-20 text-center">Please login to view your profile.</div>;

  return (
    <div className="container py-16">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-12 items-start mb-24">
        <div className="relative group">
          <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl relative z-10">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullname?.firstname}`}
              alt={user.fullname?.firstname}
              className="w-full h-full object-cover bg-surface-container"
            />
          </div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-white z-20 shadow-lg">
            <CheckCircle2 size={24} />
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-[3rem] -rotate-6 scale-105 z-0 transition-transform group-hover:rotate-0"></div>
        </div>

        <div className="flex-grow pt-4">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h1 className="display-lg text-5xl leading-tight flex items-center gap-3">
              {user.fullname?.firstname} {user.fullname?.lastname}
              {user.averageRating >= 4.5 && user.totalRatings > 0 && (
                <span className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                  <Award size={14} /> Top Rated
                </span>
              )}
            </h1>
            <div className="flex items-center gap-1 bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-bold">
              <Star size={14} fill="currentColor" /> 4.9 (42 reviews)
            </div>
          </div>
          <p className="text-xl text-primary font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>{user.role}</p>
          <div className="flex flex-wrap gap-6 text-on-surface-variant mb-8">
            <span className="flex items-center gap-2"><MapPin size={18} /> {user.location}</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowAddSkill(true)}
              className="btn btn-primary px-8 flex items-center gap-2"
            >
              <Plus size={18} /> Add New Skill
            </button>
            <button
              onClick={handleShareProfile}
              className="btn btn-outline px-8 flex items-center gap-2"
            >
              <Share2 size={18} /> Share
            </button>
            <button
              onClick={() => setShowEditProfile(true)}
              className="p-3 rounded-2xl border border-outline-variant hover:bg-white transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {showAddSkill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="headline-sm text-2xl">Add Skill</h2>
              <button onClick={() => setShowAddSkill(false)} className="text-on-surface-variant hover:text-on-surface">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="label-md mb-2 block font-bold">Skill Name</label>
                <input
                  type="text"
                  value={newSkill.skill}
                  onChange={(e) => setNewSkill({ ...newSkill, skill: e.target.value })}
                  required
                  placeholder="e.g. React"
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="label-md mb-2 block font-bold">Description</label>
                <textarea
                  value={newSkill.des}
                  onChange={(e) => setNewSkill({ ...newSkill, des: e.target.value })}
                  required
                  placeholder="What can you teach or what do you want to learn?"
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 ring-primary/20 outline-none min-h-[100px]"
                ></textarea>
              </div>
              <div>
                <label className="label-md mb-2 block font-bold">Type</label>
                <select
                  value={newSkill.type}
                  onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 ring-primary/20 outline-none"
                >
                  <option value="offer">Offering Expertise</option>
                  <option value="seek">Seeking Knowledge</option>
                </select>
              </div>
              <button type="submit" className="w-full btn btn-primary py-3 justify-center mt-4">
                Save Skill
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
        <div className="md:col-span-2 space-y-16">
          <section>
            <h2 className="headline-sm mb-6">About {user.fullname?.firstname}</h2>
            <p className="text-lg text-on-surface-variant leading-relaxed text-pretty">
              {user.bio}
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-bold text-xl mb-6" style={{ fontFamily: 'var(--font-display)' }}>Offering Expertise</h3>
              <div className="space-y-4">
                {offeredSkills.map(s => (
                  <div key={s._id} className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex justify-between items-start group">
                    <div>
                      <p className="font-bold text-primary">{s.skillname}</p>
                      <p className="text-sm text-on-surface-variant">{s.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteSkill(s._id)}
                      className="text-on-surface-variant transition-none"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {offeredSkills.length === 0 && <p className="text-on-surface-variant text-sm italic">No skills added yet.</p>}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-6" style={{ fontFamily: 'var(--font-display)' }}>Seeking Knowledge</h3>
              <div className="space-y-4">
                {skillsToLearn.map(s => (
                  <div key={s._id} className="p-4 rounded-2xl bg-secondary/5 border border-secondary/10 flex justify-between items-start group">
                    <div>
                      <p className="font-bold text-secondary">{s.skillToLearn}</p>
                      <p className="text-sm text-on-surface-variant">{s.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteSkill(s._id)}
                      className="text-on-surface-variant transition-none"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {skillsToLearn.length === 0 && <p className="text-on-surface-variant text-sm italic">No skills listed yet.</p>}
              </div>
            </div>
          </section>

          <section>
            <h2 className="headline-sm mb-6">Your Posts</h2>
            <div className="space-y-6">
              {posts.map(post => (
                <div key={post._id} className="bg-surface-container rounded-3xl p-6 shadow-sm border border-outline-variant/30 relative">
                  <div className="absolute top-6 right-6 flex gap-2">
                    <button onClick={() => {
                      setEditPostData({ id: post._id, content: post.content });
                      setShowEditPost(true);
                    }} className="text-on-surface-variant hover:text-primary">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDeletePost(post._id)} className="text-on-surface-variant hover:text-error">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullname?.firstname}`}
                      className="w-12 h-12 rounded-full bg-white border-2 border-primary/20"
                      alt="avatar"
                    />
                    <div>
                      <h3 className="font-bold">{user.fullname?.firstname} {user.fullname?.lastname}</h3>
                      <p className="text-sm text-on-surface-variant">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="mb-4 text-on-surface-variant whitespace-pre-wrap pr-12">{post.content}</p>
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
              {posts.length === 0 && <p className="text-on-surface-variant text-sm italic">You haven't posted anything yet.</p>}
            </div>
          </section>
        </div>

        <div className="space-y-12">
          <div className="card bg-surface-container border border-outline-variant p-8 rounded-[2rem]">
            <h3 className="font-bold text-lg mb-6" style={{ fontFamily: 'var(--font-display)' }}>Verification</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Identity</span>
                <span className="text-secondary font-bold flex items-center gap-1">Verified <CheckCircle2 size={14} /></span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Professional</span>
                <span className="text-secondary font-bold flex items-center gap-1">Verified <CheckCircle2 size={14} /></span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Email</span>
                <span className="font-bold">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="headline-sm text-2xl">Edit Profile</h2>
              <button onClick={() => setShowEditProfile(false)} className="text-on-surface-variant hover:text-on-surface">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="label-md mb-2 block font-bold">Location</label>
                <input
                  type="text"
                  value={editProfileData.location}
                  onChange={(e) => setEditProfileData({ ...editProfileData, location: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="label-md mb-2 block font-bold">Bio</label>
                <textarea
                  value={editProfileData.bio}
                  onChange={(e) => setEditProfileData({ ...editProfileData, bio: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 ring-primary/20 outline-none min-h-[100px]"
                ></textarea>
              </div>
              <button type="submit" className="w-full btn btn-primary py-3 justify-center mt-4">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="headline-sm text-2xl">Edit Post</h2>
              <button onClick={() => setShowEditPost(false)} className="text-on-surface-variant hover:text-on-surface">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleEditPostSubmit} className="space-y-4">
              <div>
                <label className="label-md mb-2 block font-bold">Content</label>
                <textarea
                  value={editPostData.content}
                  onChange={(e) => setEditPostData({ ...editPostData, content: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 ring-primary/20 outline-none min-h-[150px]"
                ></textarea>
              </div>
              <button type="submit" className="w-full btn btn-primary py-3 justify-center mt-4">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
