import React, { useState, useEffect } from 'react';
import {
  Star,
  MapPin,
  CheckCircle2,
  Share2,
  Award,
  Sparkles,
  ShieldCheck,
  Plus,
  Trash2,
  Edit,
  Settings,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { skillService } from '../services/skillService';
import { feedService } from '../services/feedService';
import { userService } from '../services/userService';
import { aiService } from '../services/aiService';
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
  const [aiRawText, setAiRawText] = useState('');
  const [aiExtracting, setAiExtracting] = useState(false);

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
      setPosts(res.data.posts || []);
    } catch (error) {
      console.error('Failed to fetch posts', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const [offeredRes, learnRes] = await Promise.all([
        skillService.getOfferedSkills(),
        skillService.getSkillsToLearn()
      ]);
      setOfferedSkills(offeredRes.data.skills || []);
      setSkillsToLearn(learnRes.data.skills || []);
    } catch (error) {
      console.error('Failed to fetch skills', error);
    }
  };

  const handleAutoFillBio = async () => {
    if (!aiRawText.trim()) {
      toast.error('Please enter notes or background to extract from');
      return;
    }
    setAiExtracting(true);
    try {
      const res = await aiService.extractSkills(aiRawText);
      if (res.data?.suggestedBio) {
        setEditProfileData(prev => ({ ...prev, bio: res.data.suggestedBio }));
        toast.success('Bio synthesized with AI');
      }
    } catch (err) {
      toast.error('Failed to generate bio');
    } finally {
      setAiExtracting(false);
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
      toast.success('Skill removed');
      fetchSkills();
    } catch (error) {
      toast.error('Failed to delete skill');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await userService.updateProfile(editProfileData);
      toast.success('Profile updated');
      setShowEditProfile(false);
      if (user) {
        user.bio = editProfileData.bio;
        user.location = editProfileData.location;
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to remove this showcase?")) return;
    try {
      await feedService.deletePost(postId);
      toast.success('Showcase removed');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete showcase');
    }
  };

  const handleEditPostSubmit = async (e) => {
    e.preventDefault();
    try {
      await feedService.updatePost(editPostData.id, { content: editPostData.content });
      toast.success('Showcase updated');
      setShowEditPost(false);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to update showcase');
    }
  };

  const handleShareProfile = () => {
    const url = `${window.location.origin}/profile/${user._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied to clipboard');
  };

  if (!user) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center">
        <div className="ui-card max-w-md mx-auto p-8 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
          <p className="text-sm font-semibold text-[#F5F6FA] mb-4">Please log in to manage your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      
      {/* Profile Hero Banner */}
      <div className="ui-card p-6 sm:p-8 mb-10 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            
            {/* Avatar Frame */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-none overflow-hidden border-2 border-[rgba(255,255,255,0.2)] bg-[#242A32] shadow-md">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullname?.firstname || 'User'}`}
                  alt={user.fullname?.firstname}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#55E6C1] text-[#2F3640] rounded-none flex items-center justify-center font-bold shadow-md">
                <CheckCircle2 size={15} />
              </div>
            </div>

            {/* Profile Info */}
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <h1 className="heading-h1 text-2xl sm:text-3xl text-[#F5F6FA]">
                  {user.fullname?.firstname} {user.fullname?.lastname}
                </h1>
                <span className="tag-chip text-[10px]">MEMBER</span>
                <span className="tag-chip text-[10px] bg-[#2B313A] text-[#F5F6FA] border-[rgba(255,255,255,0.15)]">
                  <Star size={11} fill="currentColor" className="inline mr-1 text-[#FFA502]" />
                  4.9 RATING
                </span>
              </div>

              <p className="font-mono text-xs text-[#55E6C1] uppercase tracking-wider mb-2 font-semibold">
                {user.role || 'Full Stack Engineer & Mentor'}
              </p>

              <div className="flex flex-wrap gap-4 text-xs text-[#A4B0BE] font-mono">
                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-[#6C5CE7]" /> {user.location || 'Remote'}</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#55E6C1]" /> Identity Verified</span>
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
            <button
              onClick={() => setShowAddSkill(true)}
              className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 rounded-none"
            >
              <Plus size={14} />
              <span>Add Skill</span>
            </button>
            <button
              onClick={handleShareProfile}
              className="btn btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 rounded-none"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
            <button
              onClick={() => setShowEditProfile(true)}
              className="btn btn-secondary text-xs p-2 rounded-none"
              title="Edit Profile Settings"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Bio / About */}
          <section className="ui-card p-6 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
            <div className="flex items-center justify-between mb-3 border-b border-[rgba(255,255,255,0.08)] pb-2">
              <h2 className="heading-h2 text-base text-[#F5F6FA]">About Me</h2>
              <span className="font-mono text-[10px] text-[#718093]">SYNOPSIS</span>
            </div>
            <p className="body-md text-sm text-[#A4B0BE] leading-relaxed">
              {user.bio || "No biography added yet. Open profile settings to craft your bio or generate one with the AI bio synthesizer."}
            </p>
          </section>

          {/* Bilateral Skills Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Offering Skills */}
            <div className="ui-card p-6 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(255,255,255,0.08)]">
                <div>
                  <span className="tag-chip text-[9px] mb-1 inline-block">OFFERING</span>
                  <h3 className="heading-h2 text-sm text-[#F5F6FA]">Teaching Expertise</h3>
                </div>
                <span className="font-mono text-xs font-semibold text-[#55E6C1]">
                  {offeredSkills.length} Skills
                </span>
              </div>
              <div className="space-y-3">
                {offeredSkills.map(s => (
                  <div key={s._id} className="p-3.5 rounded-none bg-[#2B313A] border border-[rgba(255,255,255,0.08)] flex justify-between items-start group hover:border-[#6C5CE7] transition-colors">
                    <div>
                      <p className="font-bold text-xs text-[#F5F6FA]">{s.skillname}</p>
                      <p className="text-[11px] text-[#A4B0BE] mt-1">{s.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteSkill(s._id)}
                      className="text-[#718093] hover:text-[#FF7675] p-1 transition-colors"
                      title="Remove skill"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {offeredSkills.length === 0 && (
                  <p className="text-xs text-[#718093] italic py-2 font-mono">No skills offered yet. Add your first skill!</p>
                )}
              </div>
            </div>

            {/* Seeking Skills */}
            <div className="ui-card p-6 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(255,255,255,0.08)]">
                <div>
                  <span className="tag-chip text-[9px] mb-1 inline-block">SEEKING</span>
                  <h3 className="heading-h2 text-sm text-[#F5F6FA]">Learning Goals</h3>
                </div>
                <span className="font-mono text-xs font-semibold text-[#55E6C1]">
                  {skillsToLearn.length} Goals
                </span>
              </div>
              <div className="space-y-3">
                {skillsToLearn.map(s => (
                  <div key={s._id} className="p-3.5 rounded-none bg-[#2B313A] border border-[rgba(255,255,255,0.08)] flex justify-between items-start group hover:border-[#6C5CE7] transition-colors">
                    <div>
                      <p className="font-bold text-xs text-[#F5F6FA]">{s.skillToLearn}</p>
                      <p className="text-[11px] text-[#A4B0BE] mt-1">{s.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteSkill(s._id)}
                      className="text-[#718093] hover:text-[#FF7675] p-1 transition-colors"
                      title="Remove goal"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {skillsToLearn.length === 0 && (
                  <p className="text-xs text-[#718093] italic py-2 font-mono">No learning targets listed yet.</p>
                )}
              </div>
            </div>
          </section>

          {/* User Showcases */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="heading-h2 text-base text-[#F5F6FA]">Your Showcases ({posts.length})</h2>
              <span className="font-mono text-[10px] text-[#718093]">PORTFOLIO ARTIFACTS</span>
            </div>

            <div className="space-y-4">
              {posts.map(post => (
                <div key={post._id} className="ui-card p-5 bg-[#353B48] border border-[rgba(255,255,255,0.12)] relative rounded-none">
                  <div className="absolute top-4 right-4 flex gap-1">
                    <button
                      onClick={() => {
                        setEditPostData({ id: post._id, content: post.content });
                        setShowEditPost(true);
                      }}
                      className="p-1.5 rounded-none text-[#A4B0BE] hover:text-[#F5F6FA] hover:bg-[#2B313A] transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="p-1.5 rounded-none text-[#A4B0BE] hover:text-[#FF7675] hover:bg-[rgba(255,118,117,0.1)] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <p className="font-mono text-[10px] text-[#718093] mb-2">
                    Posted on {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                  <p className="body-md text-sm text-[#F5F6FA] mb-4 whitespace-pre-wrap pr-14 leading-relaxed">
                    {post.content}
                  </p>

                  {post.mediaUrl && (
                    <div className="rounded-none overflow-hidden aspect-video bg-[#242A32] max-h-64 border border-[rgba(255,255,255,0.1)]">
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
                  <p className="text-xs text-[#A4B0BE] font-mono">You haven't posted any showcases yet. Share your milestones on the Feed!</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Verification */}
        <div className="space-y-6">
          <div className="ui-card p-6 bg-[#2B313A] border border-[rgba(255,255,255,0.12)] space-y-4 rounded-none">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
              <h3 className="heading-h2 text-xs text-[#F5F6FA] uppercase font-semibold">Reputation & Reviews</h3>
              <span className="tag-chip text-[9px]">ACTIVE</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-[#A4B0BE]">Identity Verification</span>
                <span className="text-[#55E6C1] font-semibold flex items-center gap-1 font-mono text-[10px]">
                  VERIFIED <CheckCircle2 size={12} />
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-[#A4B0BE]">Commons Honor Code</span>
                <span className="text-[#55E6C1] font-semibold flex items-center gap-1 font-mono text-[10px]">
                  SIGNED <CheckCircle2 size={12} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A4B0BE]">Account Email</span>
                <span className="font-mono text-[11px] text-[#F5F6FA] truncate max-w-[150px]">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Skill Modal: z-index overlay (200), modal (300) per DESIGN.md */}
      {showAddSkill && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="z-[300] ui-card rounded-none p-6 sm:p-7 w-full max-w-md bg-[#353B48] border border-[rgba(255,255,255,0.15)] shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[rgba(255,255,255,0.1)]">
              <div>
                <span className="tag-chip text-[9px] mb-1 inline-block">REGISTRY</span>
                <h2 className="heading-h2 text-base text-[#F5F6FA]">Add Skill</h2>
              </div>
              <button onClick={() => setShowAddSkill(false)} className="p-1 rounded-none hover:bg-[#2B313A] text-[#A4B0BE] hover:text-[#F5F6FA]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSkill} className="space-y-4">
              <div className="input-group">
                <label className="input-label">Skill Title</label>
                <input
                  type="text"
                  value={newSkill.skill}
                  onChange={(e) => setNewSkill({ ...newSkill, skill: e.target.value })}
                  required
                  placeholder="e.g. Conversational Spanish, React & Node, UI/UX Design, Acoustic Guitar"
                  className="input-field rounded-none"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Detail & Scope</label>
                <textarea
                  value={newSkill.des}
                  onChange={(e) => setNewSkill({ ...newSkill, des: e.target.value })}
                  required
                  placeholder="What skills can you teach or what are you excited to learn?"
                  className="input-field min-h-[90px] resize-none rounded-none"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Direction</label>
                <select
                  value={newSkill.type}
                  onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value })}
                  className="input-field rounded-none"
                >
                  <option value="offer" className="bg-[#242A32] text-[#F5F6FA]">Offering Expertise (Teach)</option>
                  <option value="seek" className="bg-[#242A32] text-[#F5F6FA]">Seeking Knowledge (Learn)</option>
                </select>
              </div>
              <button type="submit" className="w-full btn btn-primary py-2.5 justify-center text-xs font-semibold mt-2 rounded-none">
                Save Skill
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="z-[300] ui-card rounded-none p-6 sm:p-7 w-full max-w-md bg-[#353B48] border border-[rgba(255,255,255,0.15)] shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[rgba(255,255,255,0.1)]">
              <div>
                <span className="tag-chip text-[9px] mb-1 inline-block">SETTINGS</span>
                <h2 className="heading-h2 text-base text-[#F5F6FA]">Edit Profile</h2>
              </div>
              <button onClick={() => setShowEditProfile(false)} className="p-1 rounded-none hover:bg-[#2B313A] text-[#A4B0BE] hover:text-[#F5F6FA]">
                <X size={18} />
              </button>
            </div>

            {/* AI Synthesizer Box */}
            <div className="p-3.5 mb-4 rounded-none bg-[#2B313A] border border-[rgba(255,255,255,0.1)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F5F6FA] flex items-center gap-1.5 font-mono">
                  <Sparkles size={13} className="text-[#55E6C1]" /> AI Bio Assistant
                </span>
                <button
                  type="button"
                  onClick={handleAutoFillBio}
                  disabled={aiExtracting || !aiRawText.trim()}
                  className="font-mono text-xs text-[#55E6C1] hover:underline disabled:opacity-40"
                >
                  {aiExtracting ? 'Synthesizing...' : 'Synthesize Bio'}
                </button>
              </div>
              <textarea
                value={aiRawText}
                onChange={(e) => setAiRawText(e.target.value)}
                placeholder="Paste rough notes, background, or areas of focus..."
                className="input-field text-xs min-h-[55px] resize-none rounded-none"
              />
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="input-group">
                <label className="input-label">Location & Timezone</label>
                <input
                  type="text"
                  value={editProfileData.location}
                  onChange={(e) => setEditProfileData({ ...editProfileData, location: e.target.value })}
                  required
                  className="input-field rounded-none"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Biography</label>
                <textarea
                  value={editProfileData.bio}
                  onChange={(e) => setEditProfileData({ ...editProfileData, bio: e.target.value })}
                  required
                  className="input-field min-h-[90px] resize-none rounded-none"
                />
              </div>
              <button type="submit" className="w-full btn btn-primary py-2.5 justify-center text-xs font-semibold mt-2 rounded-none">
                Save Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Showcase Modal */}
      {showEditPost && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="z-[300] ui-card rounded-none p-6 sm:p-7 w-full max-w-md bg-[#353B48] border border-[rgba(255,255,255,0.15)] shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[rgba(255,255,255,0.1)]">
              <div>
                <span className="tag-chip text-[9px] mb-1 inline-block">UPDATE</span>
                <h2 className="heading-h2 text-base text-[#F5F6FA]">Edit Showcase</h2>
              </div>
              <button onClick={() => setShowEditPost(false)} className="p-1 rounded-none hover:bg-[#2B313A] text-[#A4B0BE] hover:text-[#F5F6FA]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditPostSubmit} className="space-y-4">
              <div className="input-group">
                <label className="input-label">Caption</label>
                <textarea
                  value={editPostData.content}
                  onChange={(e) => setEditPostData({ ...editPostData, content: e.target.value })}
                  required
                  className="input-field min-h-[120px] resize-none rounded-none"
                />
              </div>
              <button type="submit" className="w-full btn btn-primary py-2.5 justify-center text-xs font-semibold rounded-none">
                Save Showcase
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
