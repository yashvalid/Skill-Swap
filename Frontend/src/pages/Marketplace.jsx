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

// Curated default mentors spanning both technical and non-technical disciplines
const CURATED_PEERS = [
  {
    _id: 'peer-1',
    fullname: { firstname: 'Sarah', lastname: 'Lin' },
    role: 'Lead UI/UX Designer',
    category: 'Design & Creative',
    bio: 'Crafting production design systems, responsive wireframes, and interactive prototypes in Figma.',
    location: 'San Francisco, CA',
    skillsOffered: ['Figma Design', 'UI/UX Architecture', 'Design Systems', 'User Research'],
    skillsNeeded: ['React & Next.js', 'TypeScript', 'Web Development'],
    averageRating: 4.95,
    totalRatings: 34
  },
  {
    _id: 'peer-2',
    fullname: { firstname: 'Marcus', lastname: 'Thorne' },
    role: 'Backend Architect',
    category: 'Coding & Tech',
    bio: 'Specializing in high-throughput distributed systems, WebSocket APIs, and database optimization.',
    location: 'Berlin / Remote',
    skillsOffered: ['Distributed Systems', 'Redis Architecture', 'Node.js & Express', 'Docker'],
    skillsNeeded: ['UI/UX Design', 'Conversational Spanish', 'Video Editing'],
    averageRating: 4.9,
    totalRatings: 48
  },
  {
    _id: 'peer-3',
    fullname: { firstname: 'Sofia', lastname: 'Morales' },
    role: 'Language Coach & Polyglot',
    category: 'Languages',
    bio: 'Native Spanish and fluent French speaker helping peers achieve conversational fluency and professional confidence.',
    location: 'Madrid / Remote',
    skillsOffered: ['Conversational Spanish', 'Business French', 'Accent & Pronunciation', 'Grammar'],
    skillsNeeded: ['Python for Data', 'Web Development', 'Figma Basics'],
    averageRating: 4.98,
    totalRatings: 52
  },
  {
    _id: 'peer-4',
    fullname: { firstname: 'David', lastname: 'Kim' },
    role: 'Music Producer & Audio Engineer',
    category: 'Music & Audio',
    bio: 'Music producer and guitarist. Teaching Ableton Live production, vocal mixing, beat making, and acoustic guitar.',
    location: 'Seoul / Remote',
    skillsOffered: ['Ableton Live', 'Vocal Mixing', 'Acoustic Guitar', 'Sound Design'],
    skillsNeeded: ['React Web Basics', 'SEO Strategy', 'Content Writing'],
    averageRating: 4.91,
    totalRatings: 29
  },
  {
    _id: 'peer-5',
    fullname: { firstname: 'Elena', lastname: 'Vance' },
    role: 'Product Strategist & Speaker',
    category: 'Business & Growth',
    bio: 'Helping builders shape compelling pitch decks, public speaking confidence, and product positioning.',
    location: 'New York, NY',
    skillsOffered: ['Public Speaking', 'Pitch Deck Storytelling', 'Product Strategy', 'Brand Positioning'],
    skillsNeeded: ['React Basics', 'Graphic Design', 'Video Editing'],
    averageRating: 5.0,
    totalRatings: 62
  },
  {
    _id: 'peer-6',
    fullname: { firstname: 'Lucas', lastname: 'Mendes' },
    role: 'Video Editor & Motion Designer',
    category: 'Design & Creative',
    bio: 'Commercial video creator. Teaching Premiere Pro cutting, After Effects animations, and visual storytelling.',
    location: 'S?o Paulo / Remote',
    skillsOffered: ['Video Editing', 'After Effects', 'Storyboarding', 'Color Grading'],
    skillsNeeded: ['TypeScript', 'Full-Stack Development', 'PostgreSQL'],
    averageRating: 4.89,
    totalRatings: 37
  },
  {
    _id: 'peer-7',
    fullname: { firstname: 'Chloe', lastname: 'Dupont' },
    role: 'AI & Data Science Researcher',
    category: 'Coding & Tech',
    bio: 'Implementing practical Python machine learning models, retrieval pipelines, and data analytics.',
    location: 'Paris, France',
    skillsOffered: ['Python & ML', 'Data Visualization', 'SQL Analytics', 'AI Prompting'],
    skillsNeeded: ['Conversational French', 'Audio Podcast Editing', 'UI Design'],
    averageRating: 4.92,
    totalRatings: 41
  },
  {
    _id: 'peer-8',
    fullname: { firstname: 'Amara', lastname: 'Okonkwo' },
    role: 'Content Strategist & Copywriter',
    category: 'Writing',
    bio: 'Direct-response copywriter and editor helping founders write engaging articles, newsletters, and landing pages.',
    location: 'London / Remote',
    skillsOffered: ['Copywriting', 'SEO Articles', 'Creative Writing', 'Brand Voice'],
    skillsNeeded: ['Webflow & HTML/CSS', 'Basic JavaScript', 'Figma'],
    averageRating: 4.96,
    totalRatings: 44
  }
];

const CATEGORY_MAP = {
  'Coding & Tech': ['developer', 'engineer', 'backend', 'frontend', 'full-stack', 'system', 'python', 'react', 'code', 'docker', 'ai', 'data', 'sql', 'typescript'],
  'Design & Creative': ['design', 'figma', 'ui', 'ux', 'video', 'motion', 'animation', 'creative', 'art', 'color grading'],
  'Languages': ['language', 'spanish', 'french', 'german', 'japanese', 'mandarin', 'polyglot', 'linguist', 'accent', 'pronunciation'],
  'Music & Audio': ['music', 'audio', 'sound', 'guitar', 'piano', 'ableton', 'vocal', 'production'],
  'Business & Growth': ['business', 'product', 'strategy', 'finance', 'marketing', 'leadership', 'sales', 'speaking', 'pitch'],
  'Writing': ['writing', 'copywriting', 'content', 'seo', 'storytelling', 'article', 'editorial']
};

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

  const categories = ['All', 'Coding & Tech', 'Design & Creative', 'Languages', 'Music & Audio', 'Business & Growth', 'Writing'];

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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[rgba(255,255,255,0.12)]">
        <div>
          <span className="font-mono text-xs uppercase text-[#FFEEA8] font-semibold tracking-wider">
            Mentor Directory
          </span>
          <h1 className="heading-h1 text-[#F7F8FC] mt-1">
            Skill Marketplace
          </h1>
          <p className="body-md text-sm text-[#A4B0C6] mt-1 max-w-xl">
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71809B]" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by skill (e.g. React, Spanish, Video Editing, Guitar)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#171D2B] border border-[rgba(255,255,255,0.15)] focus:border-[#2B3F74] focus:ring-2 focus:ring-[#2B3F74] focus:ring-offset-2 focus:ring-offset-[#202738] text-sm text-[#F7F8FC] placeholder-[#71809B] outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4B0C6] hover:text-[#F7F8FC]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 p-1 bg-[#202738] rounded-xl overflow-x-auto border border-[rgba(255,255,255,0.1)] scrollbar-none touch-pan-x">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-tight transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#2B3F74] text-white font-semibold shadow-xs'
                  : 'text-[#A4B0C6] hover:text-[#F7F8FC] hover:bg-[#171D2B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Mentors */}
      {filteredUsers.length === 0 ? (
        <div className="ui-card p-12 text-center max-w-md mx-auto my-12 bg-[#283144] border border-[rgba(255,255,255,0.12)] rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-[#171D2B] text-[#FFEEA8] flex items-center justify-center mx-auto mb-3">
            <Inbox size={22} />
          </div>
          <h3 className="font-bold text-base text-[#F7F8FC] mb-1">No Mentors Found</h3>
          <p className="text-xs text-[#A4B0C6] mb-4">
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
                className="ui-card p-6 flex flex-col justify-between group bg-[#283144] border border-[rgba(255,255,255,0.12)] hover:border-[#2B3F74] rounded-2xl"
              >
                <div>
                  {/* Header: Avatar, Name, Rating */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => navigate(`/profile/${u._id}`)}
                    >
                      <div className="w-11 h-11 rounded-full bg-[#2B3F74] text-white font-mono font-bold text-sm flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#F7F8FC] group-hover:underline">
                          {u.fullname?.firstname} {u.fullname?.lastname}
                        </h3>
                        <p className="text-xs text-[#A4B0C6] truncate max-w-[150px]">
                          {u.role}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono text-xs font-semibold text-[#FFEEA8] bg-[#171D2B] px-2.5 py-0.5 rounded-full border border-[rgba(255, 238, 168,0.3)] flex items-center gap-1">
                      <Star size={11} fill="currentColor" className="text-[#FFA502]" />
                      <span>{u.averageRating?.toFixed(1) || '5.0'}</span>
                    </span>
                  </div>

                  {/* Bio */}
                  <p className="body-md text-xs text-[#A4B0C6] line-clamp-2 leading-relaxed mb-4">
                    {u.bio || "Passionate about reciprocal skill mastery and knowledge exchange."}
                  </p>

                  {/* Offers Section */}
                  <div className="space-y-1.5 mb-3 bg-[#202738] p-3 rounded-xl border border-[rgba(255,255,255,0.08)]">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#FFEEA8] block">
                      Teaches
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {u.skillsOffered?.slice(0, 3).map((sk, i) => (
                        <span key={i} className="tag-chip text-[10px]">
                          {sk}
                        </span>
                      ))}
                      {u.skillsOffered?.length > 3 && (
                        <span className="font-mono text-[10px] text-[#A4B0C6] px-1.5 py-0.5">
                          +{u.skillsOffered.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Seeking Section */}
                  {u.skillsNeeded && u.skillsNeeded.length > 0 && (
                    <div className="space-y-1 mb-5">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#71809B] block">
                        Wants to Learn
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {u.skillsNeeded.slice(0, 2).map((sk, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#171D2B] border border-[rgba(255,255,255,0.1)] text-[#A4B0C6]">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom: Location & Action */}
                <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                  <span className="text-xs text-[#71809B] flex items-center gap-1 font-mono">
                    <MapPin size={12} className="text-[#A4B0C6]" /> {u.location || 'Remote'}
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
          <div className="z-[300] ui-card rounded-2xl p-6 sm:p-8 max-w-md w-full bg-[#283144] text-center border border-[rgba(255,255,255,0.15)] shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#202738] text-[#FFEEA8] flex items-center justify-center mx-auto mb-4 border border-[rgba(255, 238, 168,0.3)]">
              <ArrowLeftRight size={20} strokeWidth={2.5} />
            </div>
            <h3 className="heading-h2 text-[#F7F8FC] mb-2">
              Join the Exchange
            </h3>
            <p className="body-md text-xs text-[#A4B0C6] leading-relaxed mb-6">
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="z-[300] ui-card rounded-2xl p-4 sm:p-8 w-full max-w-lg bg-[#283144] shadow-2xl border border-[rgba(255,255,255,0.15)] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[rgba(255,255,255,0.1)]">
              <div>
                <span className="font-mono text-[10px] text-[#FFEEA8] uppercase font-semibold">
                  Exchange Proposal
                </span>
                <h2 className="heading-h2 text-[#F7F8FC]">
                  Swap with {selectedUser.fullname?.firstname}
                </h2>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg hover:bg-[#202738] text-[#A4B0C6] hover:text-[#F7F8FC]"
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
                  className="input-field"
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
                  className="input-field"
                />
              </div>

              {/* AI Proposal Pitch Helper */}
              <div className="p-3.5 rounded-xl bg-[#202738] border border-[rgba(255,255,255,0.1)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#F7F8FC] flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#FFEEA8]" /> Proposal Assistant
                  </span>
                  <button
                    type="button"
                    onClick={handleGeneratePitch}
                    disabled={generatingPitch || !swapData.offersSkill || !swapData.requestsSkill}
                    className="font-mono text-xs text-[#FFEEA8] hover:underline disabled:opacity-40 flex items-center gap-1"
                  >
                    <Sparkles size={11} />
                    <span>{generatingPitch ? 'Synthesizing...' : 'Draft Pitch'}</span>
                  </button>
                </div>

                {generatingPitch && (
                  <div className="h-14 w-full skeleton-shimmer rounded-xl" />
                )}

                {pitchData && !generatingPitch && (
                  <div className="p-3 rounded-xl bg-[#171D2B] border border-[rgba(255,255,255,0.1)] text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#F7F8FC]">{pitchData.hook}</span>
                      <button
                        type="button"
                        onClick={handleCopyPitch}
                        className="text-[#A4B0C6] hover:text-[#F7F8FC] flex items-center gap-1 text-[11px] font-mono"
                      >
                        {copiedPitch ? <Check size={12} className="text-[#FFEEA8]" /> : <Copy size={12} />}
                        <span>{copiedPitch ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-[#A4B0C6] italic leading-relaxed text-[11px]">
                      "{pitchData.pitch}"
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full btn btn-primary py-2.5 justify-center text-sm font-semibold mt-2 rounded-xl"
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
