import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Star, 
  X, 
  MapPin, 
  Sparkles, 
  Check, 
  Copy, 
  ArrowUpRight,
  ArrowLeftRight,
  UserCheck,
  Filter,
  Layers,
  Inbox
} from 'lucide-react';
import { userService } from '../services/userService';
import { swapService } from '../services/swapService';
import { aiService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// Curated default mentors to ensure the commons is never empty
const CURATED_PEERS = [
  {
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
  {
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
  {
    _id: 'peer-3',
    fullname: { firstname: 'Elena', lastname: 'Vance' },
    role: 'Staff Product Strategist',
    bio: 'Helping technical founders and builders shape product narratives, user retention loops, and UX research.',
    location: 'New York, NY',
    skillsOffered: ['Product Strategy', 'UX Architecture', 'Growth Loops', 'User Research'],
    skillsNeeded: ['React Basics', 'Full-Stack Development', 'API Design'],
    averageRating: 5.0,
    totalRatings: 62
  },
  {
    _id: 'peer-4',
    fullname: { firstname: 'Kai', lastname: 'Tanaka' },
    role: 'iOS & macOS Developer',
    bio: 'Building fluid, gesture-driven apps with SwiftUI, Metal shaders, and Apple Human Interface guidelines.',
    location: 'Tokyo / Remote',
    skillsOffered: ['SwiftUI', 'Apple Guidelines', 'Metal Shaders', 'CoreAnimation'],
    skillsNeeded: ['GraphQL', 'Backend Scalability', 'PostgreSQL'],
    averageRating: 4.88,
    totalRatings: 27
  },
  {
    _id: 'peer-5',
    fullname: { firstname: 'Chloe', lastname: 'Dupont' },
    role: 'AI & ML Research Engineer',
    bio: 'Implementing local LLMs, fine-tuning reasoning models, and crafting retrieval-augmented generation pipelines.',
    location: 'Paris, France',
    skillsOffered: ['LLM Orchestration', 'RAG Pipelines', 'Python', 'Vector DBs'],
    skillsNeeded: ['Modern Web UI', 'Tailwind', 'Design Systems'],
    averageRating: 4.92,
    totalRatings: 41
  },
  {
    _id: 'peer-6',
    fullname: { firstname: 'Arjun', lastname: 'Mehta' },
    role: 'Engineering Director & Mentor',
    bio: 'Mentoring engineers on leadership transitions, technical architecture reviews, and high-stakes roadmap delivery.',
    location: 'London, UK',
    skillsOffered: ['Engineering Leadership', 'System Architecture', 'Career Navigation', 'Code Review'],
    skillsNeeded: ['Rust', 'WebAssembly', 'Deep Learning'],
    averageRating: 4.97,
    totalRatings: 56
  }
];

const Marketplace = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState(CURATED_PEERS);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [swapData, setSwapData] = useState({ offersSkill: '', requestsSkill: '' });
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  // AI Pitch state
  const [pitchData, setPitchData] = useState(null);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  const categories = ['All', 'Developer', 'Designer', 'Engineer', 'Product', 'Strategist'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await userService.getAllUsers();
      const serverUsers = data.users || [];
      if (serverUsers.length > 0) {
        setUsers(serverUsers);
      }
    } catch (error) {
      // Keep curated fallback
    }
  };

  const handleOpenSwapModal = (targetUser) => {
    if (!currentUser) {
      setSelectedUser(targetUser);
      setGuestModalOpen(true);
      return;
    }
    setSelectedUser(targetUser);
    setSwapData({
      offersSkill: '',
      requestsSkill: targetUser.skillsOffered?.[0] || ''
    });
  };

  const handleRequestSwap = async (e) => {
    e.preventDefault();
    try {
      await swapService.requestSwap({
        toUserId: selectedUser._id,
        skillOffered: swapData.offersSkill,
        skillRequested: swapData.requestsSkill
      });
      toast.success('Swap request sent!');
      setSelectedUser(null);
      setSwapData({ offersSkill: '', requestsSkill: '' });
      setPitchData(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const handleGeneratePitch = async () => {
    if (!swapData.offersSkill || !swapData.requestsSkill) {
      toast.error('Please specify both skills to generate a proposal');
      return;
    }
    setGeneratingPitch(true);
    try {
      const res = await aiService.enhancePitch({
        offersSkill: swapData.offersSkill,
        requestsSkill: swapData.requestsSkill,
        partnerName: selectedUser?.fullname?.firstname || 'Partner'
      });
      if (res.data?.pitch) {
        setPitchData(res.data);
      }
    } catch (err) {
      toast.error('Failed to generate pitch');
    } finally {
      setGeneratingPitch(false);
    }
  };

  const handleCopyPitch = () => {
    if (!pitchData?.pitch) return;
    navigator.clipboard.writeText(pitchData.pitch);
    setCopiedPitch(true);
    toast.success('Pitch copied to clipboard');
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const filteredUsers = users.filter(u => {
    if (currentUser && u._id === currentUser._id) return false;
    const matchesCategory = activeCategory === 'All' || u.role?.toLowerCase().includes(activeCategory.toLowerCase());
    const query = searchTerm.toLowerCase();
    const matchesSearch = !query ||
      u.fullname?.firstname?.toLowerCase().includes(query) ||
      u.fullname?.lastname?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query) ||
      u.bio?.toLowerCase().includes(query) ||
      (u.skillsOffered && u.skillsOffered.some(s => s.toLowerCase().includes(query))) ||
      (u.skillsNeeded && u.skillsNeeded.some(s => s.toLowerCase().includes(query)));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[rgba(255,255,255,0.12)]">
        <div>
          <span className="font-mono text-xs uppercase text-[#55E6C1] font-semibold tracking-wider">
            Mentor Directory
          </span>
          <h1 className="heading-h1 text-[#F5F6FA] mt-1">
            Skill Marketplace
          </h1>
          <p className="body-md text-sm text-[#A4B0BE] mt-1 max-w-xl">
            Browse mentors offering direct 1-on-1 sessions. Propose a swap with your skills.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <span className="tag-chip text-xs">
            {filteredUsers.length} Mentors Active
          </span>
        </div>
      </header>

      {/* Spotlight Search & Category Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-stretch md:items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718093]" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search mentors by skill or stack..."
            className="w-full pl-10 pr-9 py-2.5 rounded-none bg-[#242A32] border border-[rgba(255,255,255,0.15)] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7] focus:ring-offset-2 focus:ring-offset-[#2F3640] text-sm text-[#F5F6FA] placeholder-[#718093] outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4B0BE] hover:text-[#F5F6FA]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 p-1 bg-[#2B313A] rounded-none overflow-x-auto border border-[rgba(255,255,255,0.1)]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-none text-xs font-medium tracking-tight transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#6C5CE7] text-white font-semibold shadow-xs'
                  : 'text-[#A4B0BE] hover:text-[#F5F6FA] hover:bg-[#242A32]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Mentors */}
      {filteredUsers.length === 0 ? (
        <div className="ui-card p-12 text-center max-w-md mx-auto my-12 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
          <div className="w-12 h-12 rounded-none bg-[#242A32] text-[#55E6C1] flex items-center justify-center mx-auto mb-3">
            <Inbox size={22} />
          </div>
          <h3 className="font-bold text-base text-[#F5F6FA] mb-1">No Mentors Found</h3>
          <p className="text-xs text-[#A4B0BE] mb-4">
            Try adjusting your search criteria or explore other categories.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setActiveCategory('All'); }}
            className="btn btn-secondary text-xs py-2 px-4"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((u) => {
            const initials = `${u.fullname?.firstname?.[0] || 'U'}${u.fullname?.lastname?.[0] || 'P'}`;

            return (
              <div
                key={u._id}
                className="ui-card p-6 flex flex-col justify-between group bg-[#353B48] border border-[rgba(255,255,255,0.12)] hover:border-[#6C5CE7] rounded-none"
              >
                <div>
                  {/* Header: Avatar, Name, Rating */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => navigate(`/profile/${u._id}`)}
                    >
                      <div className="w-11 h-11 rounded-none bg-[#6C5CE7] text-white font-mono font-bold text-sm flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#F5F6FA] group-hover:underline">
                          {u.fullname?.firstname} {u.fullname?.lastname}
                        </h3>
                        <p className="text-xs text-[#A4B0BE] truncate max-w-[150px]">
                          {u.role}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono text-xs font-semibold text-[#55E6C1] bg-[#242A32] px-2 py-0.5 rounded-none border border-[rgba(85,230,193,0.3)] flex items-center gap-1">
                      <Star size={11} fill="currentColor" className="text-[#FFA502]" />
                      <span>{u.averageRating?.toFixed(1) || '5.0'}</span>
                    </span>
                  </div>

                  {/* Bio */}
                  <p className="body-md text-xs text-[#A4B0BE] line-clamp-2 leading-relaxed mb-4">
                    {u.bio || "Passionate about reciprocal skill mastery and knowledge exchange."}
                  </p>

                  {/* Offers Section */}
                  <div className="space-y-1.5 mb-3 bg-[#2B313A] p-3 rounded-none border border-[rgba(255,255,255,0.08)]">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#55E6C1] block">
                      Teaches
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {u.skillsOffered?.slice(0, 3).map((sk, i) => (
                        <span key={i} className="tag-chip text-[10px]">
                          {sk}
                        </span>
                      ))}
                      {u.skillsOffered?.length > 3 && (
                        <span className="font-mono text-[10px] text-[#A4B0BE] px-1.5 py-0.5">
                          +{u.skillsOffered.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Seeking Section */}
                  {u.skillsNeeded && u.skillsNeeded.length > 0 && (
                    <div className="space-y-1 mb-5">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#718093] block">
                        Wants to Learn
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {u.skillsNeeded.slice(0, 2).map((sk, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#242A32] border border-[rgba(255,255,255,0.1)] text-[#A4B0BE]">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom: Location & Action */}
                <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                  <span className="text-xs text-[#718093] flex items-center gap-1 font-mono">
                    <MapPin size={12} className="text-[#A4B0BE]" /> {u.location || 'Remote'}
                  </span>

                  <button
                    onClick={() => handleOpenSwapModal(u)}
                    className="btn btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1"
                  >
                    <span>Propose Swap</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guest Modal: z-index overlay (200), modal (300) per DESIGN.md */}
      {guestModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="z-[300] ui-card rounded-none p-6 sm:p-8 max-w-md w-full bg-[#353B48] text-center border border-[rgba(255,255,255,0.15)] shadow-2xl">
            <div className="w-12 h-12 rounded-none bg-[#2B313A] text-[#55E6C1] flex items-center justify-center mx-auto mb-4 border border-[rgba(85,230,193,0.3)]">
              <ArrowLeftRight size={20} strokeWidth={2.5} />
            </div>
            <h3 className="heading-h2 text-[#F5F6FA] mb-2">
              Join the Exchange
            </h3>
            <p className="body-md text-xs text-[#A4B0BE] leading-relaxed mb-6">
              Sign in or create an account to propose skill exchanges, generate AI study plans, and trade knowledge directly.
            </p>
            <div className="space-y-2.5">
              <Link to="/login" className="btn btn-cta w-full py-2.5 text-xs font-semibold">
                Create Member Account
              </Link>
              <button
                onClick={() => setGuestModalOpen(false)}
                className="btn btn-secondary w-full py-2 text-xs"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Propose Swap Modal: z-index overlay (200), modal (300) */}
      {selectedUser && !guestModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="z-[300] ui-card rounded-none p-6 sm:p-8 w-full max-w-lg bg-[#353B48] shadow-2xl border border-[rgba(255,255,255,0.15)] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[rgba(255,255,255,0.1)]">
              <div>
                <span className="font-mono text-[10px] text-[#55E6C1] uppercase font-semibold">
                  Exchange Proposal
                </span>
                <h2 className="heading-h2 text-[#F5F6FA]">
                  Swap with {selectedUser.fullname?.firstname}
                </h2>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-none hover:bg-[#2B313A] text-[#A4B0BE] hover:text-[#F5F6FA]"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRequestSwap} className="space-y-4">
              <div className="input-group">
                <label className="input-label">
                  Skill you offer to teach:
                </label>
                <input
                  type="text"
                  value={swapData.offersSkill}
                  onChange={(e) => setSwapData({ ...swapData, offersSkill: e.target.value })}
                  required
                  placeholder="e.g. Modern React & TypeScript Architecture"
                  className="input-field rounded-none"
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  Skill you want to learn:
                </label>
                <input
                  type="text"
                  value={swapData.requestsSkill}
                  onChange={(e) => setSwapData({ ...swapData, requestsSkill: e.target.value })}
                  required
                  placeholder="e.g. Figma Design Systems"
                  className="input-field rounded-none"
                />
              </div>

              {/* AI Proposal Pitch Helper */}
              <div className="p-3.5 rounded-none bg-[#2B313A] border border-[rgba(255,255,255,0.1)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#F5F6FA] flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#55E6C1]" /> Proposal Assistant
                  </span>
                  <button
                    type="button"
                    onClick={handleGeneratePitch}
                    disabled={generatingPitch || !swapData.offersSkill || !swapData.requestsSkill}
                    className="font-mono text-xs text-[#55E6C1] hover:underline disabled:opacity-40 flex items-center gap-1"
                  >
                    <Sparkles size={11} />
                    <span>{generatingPitch ? 'Synthesizing...' : 'Draft Pitch'}</span>
                  </button>
                </div>

                {generatingPitch && (
                  <div className="h-14 w-full skeleton-shimmer rounded-none" />
                )}

                {pitchData && !generatingPitch && (
                  <div className="p-3 rounded-none bg-[#242A32] border border-[rgba(255,255,255,0.1)] text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#F5F6FA]">{pitchData.hook}</span>
                      <button
                        type="button"
                        onClick={handleCopyPitch}
                        className="text-[#A4B0BE] hover:text-[#F5F6FA] flex items-center gap-1 text-[11px] font-mono"
                      >
                        {copiedPitch ? <Check size={12} className="text-[#55E6C1]" /> : <Copy size={12} />}
                        <span>{copiedPitch ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-[#A4B0BE] italic leading-relaxed text-[11px]">
                      "{pitchData.pitch}"
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full btn btn-primary py-2.5 justify-center text-sm font-semibold mt-2 rounded-none"
              >
                Send Swap Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
