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
  Inbox,
  Compass,
  Zap,
  MessageSquare
} from 'lucide-react';
import { userService } from '../services/userService';
import { swapService } from '../services/swapService';
import { aiService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { isUserVerified } from '../utils/userVerification';

const CATEGORY_MAP = {
  'Coding & Tech': [
    'developer', 'engineer', 'backend', 'frontend', 'full stack', 'fullstack',
    'system', 'python', 'react', 'code', 'docker', 'ai', 'data', 'sql', 'typescript',
    'golang', 'go', 'cloud', 'kubernetes', 'node', 'javascript', 'dev'
  ],
  'Design & Creative': [
    'design', 'figma', 'ui', 'ux', 'ui/ux', 'video', 'motion', 'animation', 'creative',
    'art', 'color grading', 'typography', 'tokens', 'prototyping', 'blender', '3d'
  ],
  'Languages': [
    'language', 'spanish', 'french', 'german', 'japanese', 'mandarin', 'polyglot',
    'linguist', 'accent', 'pronunciation', 'translation', 'jlpt', 'culture', 'tutor'
  ],
  'Music & Audio': [
    'music', 'audio', 'sound', 'guitar', 'piano', 'ableton', 'vocal', 'production',
    'mixing', 'mastering', 'synth', 'foley', 'acoustics'
  ],
  'Business & Growth': [
    'business', 'product', 'strategy', 'finance', 'marketing', 'leadership', 'sales',
    'speaking', 'pitch', 'pitching', 'founder', 'growth'
  ],
  'Writing': [
    'writing', 'copywriting', 'content', 'seo', 'storytelling', 'article', 'editorial',
    'technical writing', 'documentation'
  ]
};

const Marketplace = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [swapData, setSwapData] = useState({ offersSkill: '', requestsSkill: '' });
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  // Interest-based matching state
  const [discoveryMode, setDiscoveryMode] = useState('all'); // 'all' | 'affinity'
  const [affinityMatches, setAffinityMatches] = useState([]);
  const [loadingAffinity, setLoadingAffinity] = useState(false);
  const [interestSearchActive, setInterestSearchActive] = useState(false);

  // AI Pitch state
  const [pitchData, setPitchData] = useState(null);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  const categories = ['All', 'Coding & Tech', 'Design & Creative', 'Languages', 'Music & Audio', 'Business & Growth', 'Writing'];

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1. Fetch real users from MongoDB and recommended affinity ranking in parallel
      const [usersRes, affinityRes] = await Promise.allSettled([
        userService.getAllUsers(),
        aiService.getRecommendedMatches()
      ]);

      let serverUsers = [];
      if (usersRes.status === 'fulfilled' && usersRes.value.data?.users) {
        serverUsers = usersRes.value.data.users;
      }

      let affinityMap = {};
      if (affinityRes.status === 'fulfilled' && affinityRes.value.data?.matches) {
        affinityRes.value.data.matches.forEach(m => {
          if (m.user?._id) {
            affinityMap[m.user._id] = m.affinity;
          }
        });
      }

      // 2. Attach affinity data to each user
      const enrichedUsers = serverUsers.map(u => ({
        ...u,
        affinity: affinityMap[u._id] || null
      }));

      // Sort 'All Mentors' directory: Verified mentors and active profiles with skills first
      const sortedUsers = [...enrichedUsers].sort((a, b) => {
        if (Boolean(a.isVerified) !== Boolean(b.isVerified)) {
          return a.isVerified ? -1 : 1;
        }
        const aSkills = (a.skillsOffered?.length || 0);
        const bSkills = (b.skillsOffered?.length || 0);
        if (aSkills !== bSkills) return bSkills - aSkills;
        return (b.totalRatings || 0) - (a.totalRatings || 0);
      });

      setUsers(sortedUsers);

      // 3. Populate affinityMatches sorted strictly descending by highest match score
      const ranked = [...enrichedUsers]
        .filter(u => u.affinity?.matchScore)
        .sort((a, b) => (b.affinity?.matchScore || 0) - (a.affinity?.matchScore || 0));

      setAffinityMatches(ranked);
    } catch (error) {
      console.error('Failed to load marketplace users from database', error);
      setUsers([]);
      setAffinityMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDiscoveryMode = (mode) => {
    setDiscoveryMode(mode);
    setInterestSearchActive(false);
  };

  const handleInterestSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) {
      setInterestSearchActive(false);
      return;
    }

    setLoadingAffinity(true);
    setInterestSearchActive(true);
    try {
      const res = await aiService.matchByInterest(searchTerm.trim());
      if (res.data?.matches && res.data.matches.length > 0) {
        const formatted = res.data.matches.map(m => ({
          ...m.user,
          affinity: m.affinity
        }));
        setAffinityMatches(formatted);
        setDiscoveryMode('affinity');
      } else {
        toast('No direct domain match found for that query, showing all peers.', { icon: 'ℹ️' });
      }
    } catch (err) {
      console.error('Search by interest failed', err);
      toast.error('Search by interest failed');
    } finally {
      setLoadingAffinity(false);
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
    if (targetUser.affinity?.icebreaker) {
      setPitchData({
        hook: `Mutual Interest in ${targetUser.affinity.sharedDomains?.[0] || targetUser.role}`,
        pitch: targetUser.affinity.icebreaker
      });
    } else {
      setPitchData(null);
    }
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

  // Determine active display pool
  const activePool = (discoveryMode === 'affinity' && affinityMatches.length > 0)
    ? affinityMatches
    : users;

  const filteredUsers = activePool.filter(u => {
    if (currentUser && u._id === currentUser._id) return false;

    // 1. Category filter matching keywords
    if (activeCategory !== 'All') {
      const categoryKeywords = CATEGORY_MAP[activeCategory] || [];
      const userText = [
        u.role || '',
        u.bio || '',
        ...(u.skillsOffered || []),
        ...(u.skillsNeeded || []),
        ...(u.affinity?.sharedDomains || [])
      ].join(' ').toLowerCase();

      const matchesCat = categoryKeywords.some(kw => userText.includes(kw.toLowerCase()));
      if (!matchesCat) return false;
    }

    // 2. If in semantic interest search, pool is already sorted by semantic score
    if (discoveryMode === 'affinity' && interestSearchActive) {
      return true;
    }

    // 3. Normal text query filter
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    const matchesSearch =
      u.fullname?.firstname?.toLowerCase().includes(query) ||
      u.fullname?.lastname?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query) ||
      u.bio?.toLowerCase().includes(query) ||
      (u.skillsOffered && u.skillsOffered.some(s => s.toLowerCase().includes(query))) ||
      (u.skillsNeeded && u.skillsNeeded.some(s => s.toLowerCase().includes(query))) ||
      (u.affinity?.sharedDomains && u.affinity.sharedDomains.some(d => d.toLowerCase().includes(query))) ||
      (u.affinity?.synergyTags && u.affinity.synergyTags.some(t => t.toLowerCase().includes(query)));

    return matchesSearch;
  });

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[rgba(255,255,255,0.12)] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase text-[#FFEEA8] font-semibold tracking-wider">
              Peer Discovery
            </span>
            <span className="tag-chip text-[9px] py-0 px-1.5 font-mono bg-[#2B3F74]/60 text-[#FFEEA8]">
              ALGO MATCH
            </span>
          </div>
          <h1 className="heading-h1 text-[#F7F8FC] mt-0.5">
            Skill & Interest Marketplace
          </h1>
          <p className="body-md text-sm text-[#A4B0C6] mt-1 max-w-xl">
            Meet peers by complementary skills or shared domain interests. Connect 1-on-1 for verified reciprocal swaps.
          </p>
        </div>

        {/* Discovery Mode Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-[#202738] rounded-2xl border border-[rgba(255,255,255,0.1)] self-start md:self-auto">
          <button
            onClick={() => handleToggleDiscoveryMode('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              discoveryMode === 'all'
                ? 'bg-[#2B3F74] text-white shadow-xs'
                : 'text-[#A4B0C6] hover:text-[#F7F8FC]'
            }`}
          >
            <Compass size={14} />
            <span>All Mentors ({users.length})</span>
          </button>
          
          <button
            onClick={() => handleToggleDiscoveryMode('affinity')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              discoveryMode === 'affinity'
                ? 'bg-[#FFEEA8] text-[#171D2B] font-bold shadow-xs'
                : 'text-[#FFEEA8] hover:text-white'
            }`}
          >
            <Sparkles size={14} className={discoveryMode === 'affinity' ? 'text-[#171D2B]' : 'text-[#FFEEA8]'} />
            <span>Matched For You</span>
          </button>
        </div>
      </header>

      {/* Spotlight Search & Category Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-stretch md:items-center justify-between">
        <form onSubmit={handleInterestSearch} className="relative w-full md:max-w-lg flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71809B]" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by skill or interest (e.g. creative audio, indie tools, Japanese)..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-[#171D2B] border border-[rgba(255,255,255,0.15)] focus:border-[#2B3F74] focus:ring-2 focus:ring-[#2B3F74] focus:ring-offset-2 focus:ring-offset-[#202738] text-sm text-[#F7F8FC] placeholder-[#71809B] outline-none transition-colors"
          />
          
          <div className="absolute right-2 flex items-center gap-1">
            {searchTerm && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setInterestSearchActive(false); }}
                className="p-1 text-[#A4B0C6] hover:text-[#F7F8FC]"
                title="Clear"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="submit"
              className="btn btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 font-mono rounded-lg"
              title="Run semantic interest match"
            >
              <Sparkles size={11} className="text-[#FFEEA8]" />
              <span>Match</span>
            </button>
          </div>
        </form>

        {/* Category Pills */}
        <div className="flex gap-1.5 p-1 bg-[#202738] rounded-xl overflow-x-auto border border-[rgba(255,255,255,0.1)] scrollbar-none touch-pan-x">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setInterestSearchActive(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-tight transition-colors whitespace-nowrap ${
                activeCategory === cat && !interestSearchActive
                  ? 'bg-[#2B3F74] text-white font-semibold shadow-xs'
                  : 'text-[#A4B0C6] hover:text-[#F7F8FC] hover:bg-[#171D2B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Discovery Mode Notification Banner */}
      {discoveryMode === 'affinity' && (
        <div className="mb-6 p-4 rounded-2xl bg-[#202738] border border-[rgba(255,238,168,0.3)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2B3F74] text-[#FFEEA8] flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#F7F8FC]">
                  Semantic Affinity Match Engine Active
                </h3>
                <span className="tag-chip text-[9px] py-0 px-2 font-mono bg-[#171D2B] text-[#FFEEA8]">
                  MULTI-FACTOR
                </span>
              </div>
              <p className="text-xs text-[#A4B0C6] mt-0.5">
                {interestSearchActive
                  ? `Showing peers ranked by relevance to your interest query: "${searchTerm}"`
                  : 'Ranking mentors by shared domain clusters, bio context, and reciprocal learning trajectory.'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => { setDiscoveryMode('all'); setInterestSearchActive(false); }}
            className="text-xs font-mono text-[#FFEEA8] hover:underline self-end sm:self-auto shrink-0"
          >
            Switch to All Mentors →
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading || loadingAffinity ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="ui-card p-6 rounded-2xl bg-[#283144] border border-[rgba(255,255,255,0.08)] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full skeleton-shimmer" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 skeleton-shimmer rounded-md" />
                  <div className="h-3 w-1/2 skeleton-shimmer rounded-md" />
                </div>
              </div>
              <div className="h-14 w-full skeleton-shimmer rounded-xl" />
              <div className="h-10 w-full skeleton-shimmer rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        /* Empty State */
        <div className="ui-card p-12 text-center max-w-md mx-auto my-12 bg-[#283144] border border-[rgba(255,255,255,0.12)] rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-[#171D2B] text-[#FFEEA8] flex items-center justify-center mx-auto mb-3">
            <Inbox size={22} />
          </div>
          <h3 className="font-bold text-base text-[#F7F8FC] mb-1">No Matches Found in Database</h3>
          <p className="text-xs text-[#A4B0C6] mb-4">
            Try adjusting your search query or explore all community disciplines.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setActiveCategory('All'); setDiscoveryMode('all'); setInterestSearchActive(false); }}
            className="btn btn-secondary text-xs py-2 px-4"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Grid of Mentors */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((u) => {
            const initials = `${u.fullname?.firstname?.[0] || 'U'}${u.fullname?.lastname?.[0] || 'P'}`;
            const affinity = u.affinity;

            return (
              <div
                key={u._id}
                className="ui-card p-6 flex flex-col justify-between group bg-[#283144] border border-[rgba(255,255,255,0.12)] hover:border-[#2B3F74] rounded-2xl transition-all shadow-md"
              >
                <div>
                  {/* Top Bar: Avatar, Names, Rating & Affinity Score */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => navigate(`/profile/${u._id}`)}
                    >
                      <div className="w-11 h-11 rounded-full bg-[#2B3F74] text-white font-mono font-bold text-sm flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.15)]">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-base text-[#F7F8FC] group-hover:underline">
                            {u.fullname?.firstname} {u.fullname?.lastname}
                          </h3>
                          {isUserVerified(u) && (
                            <span className="tag-chip text-[9px] py-0 px-1.5 font-mono" title="Verified Swap Member">
                              VERIFIED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#A4B0C6] truncate max-w-[150px]">
                          {u.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {affinity?.matchScore && (discoveryMode === 'affinity' || affinity.matchScore >= 60) && (
                        <span className={`tag-chip text-[10px] font-bold flex items-center gap-1 shadow-xs ${
                          affinity.matchScore >= 80
                            ? 'text-[#FFEEA8] bg-[#2B3F74] border-[rgba(255,238,168,0.4)]'
                            : affinity.matchScore >= 60
                            ? 'text-[#F7F8FC] bg-[#171D2B] border-[rgba(255,255,255,0.15)]'
                            : 'text-[#A4B0C6] bg-[#171D2B]/80 border-[rgba(255,255,255,0.08)]'
                        }`}>
                          <Sparkles size={11} className={affinity.matchScore >= 80 ? 'text-[#FFEEA8]' : 'text-[#A4B0C6]'} />
                          <span>{affinity.matchScore}% Match</span>
                        </span>
                      )}
                      
                      {u.totalRatings > 0 ? (
                        <span className="font-mono text-xs font-semibold text-[#FFEEA8] bg-[#171D2B] px-2.5 py-0.5 rounded-full border border-[rgba(255,238,168,0.3)] flex items-center gap-1">
                          <Star size={11} fill="currentColor" className="text-[#FFA502]" />
                          <span>{u.averageRating?.toFixed(1) || '5.0'}</span>
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-[#A4B0C6] bg-[#171D2B] px-2 py-0.5 rounded-full border border-[rgba(255,255,255,0.08)]">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Why Connect Insight (shown in Matched For You or when high compatibility) */}
                  {affinity?.whyConnect && (discoveryMode === 'affinity' || affinity.matchScore >= 70) && (
                    <div className="mb-3 p-2.5 rounded-xl bg-[#171D2B] border border-[rgba(255,238,168,0.2)]">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-[#FFEEA8] uppercase font-semibold mb-0.5">
                        <Zap size={10} /> Why Connect
                      </div>
                      <p className="text-[11px] text-[#F7F8FC] leading-relaxed">
                        {affinity.whyConnect}
                      </p>
                    </div>
                  )}

                  {/* Synergy Hashtags */}
                  {affinity?.synergyTags && affinity.synergyTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {affinity.synergyTags.map((tag, i) => (
                        <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#202738] text-[#FFEEA8] border border-[rgba(255,238,168,0.15)]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bio */}
                  <p className="body-md text-xs text-[#A4B0C6] line-clamp-2 leading-relaxed mb-4">
                    {u.bio || "Passionate about reciprocal skill mastery and knowledge exchange."}
                  </p>

                  {/* Offers Section */}
                  <div className="space-y-1.5 mb-3 bg-[#202738] p-3 rounded-xl border border-[rgba(255,255,255,0.08)]">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#FFEEA8] block">
                      Offers & Expertise
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {u.skillsOffered && u.skillsOffered.length > 0 ? (
                        u.skillsOffered.slice(0, 3).map((sk, i) => (
                          <span key={i} className="tag-chip text-[10px]">
                            {sk}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-[#71809B] font-mono">Exploring options</span>
                      )}
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
                        Interested in Learning
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
                    className="btn btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1 rounded-xl"
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

              {/* AI Proposal Pitch & Icebreaker Helper */}
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
