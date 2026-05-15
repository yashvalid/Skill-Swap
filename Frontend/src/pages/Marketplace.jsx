import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Clock, ArrowUpRight, Zap, X, LocateIcon, MapPin } from 'lucide-react';
import { userService } from '../services/userService';
import { swapService } from '../services/swapService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Marketplace = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [swapData, setSwapData] = useState({ offersSkill: '', requestsSkill: '' });

  const categories = ['All', 'Developer', 'Designer', 'Marketer', 'Writer', 'Manager', 'Other'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await userService.getAllUsers();
      setUsers(data.users || []);
    } catch (error) {
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSwap = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please login to request a swap');
      return;
    }
    try {
      await swapService.requestSwap({
        fromUser: currentUser._id,
        toUser: selectedUser._id,
        offersSkill: swapData.offersSkill,
        requestsSkill: swapData.requestsSkill
      });
      toast.success('Swap request sent!');
      setSelectedUser(null);
      setSwapData({ offersSkill: '', requestsSkill: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesCategory = activeCategory === 'All' || u.role?.toLowerCase().includes(activeCategory.toLowerCase());
    const matchesSearch = u.fullname?.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullname?.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container py-16">
      <header className="mb-16">
        <h1 className="display-lg text-5xl mb-6">Discover <span className="text-secondary italic">Expertise</span></h1>
        <p className="text-on-surface-variant max-w-2xl text-lg">
          Browse the curated collective. Find partners who offer what you want to learn, and need what you know.
        </p>
      </header>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for people or skills..."
            className="w-full pl-12 pr-4 py-4 rounded-full bg-surface-container border-none focus:ring-2 ring-primary/20 outline-none"
          />
        </div>

        <div className="flex gap-2 p-1 bg-surface-container rounded-full overflow-x-auto no-scrollbar max-w-full">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full font-medium transition-all whitespace-nowrap ${activeCategory === cat
                ? 'bg-white shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-on-surface-variant font-medium">Loading potential partners...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredUsers.map((u, idx) => (
            <div key={u._id} className="group relative bg-white rounded-[2.5rem] border border-outline-variant/50 hover:border-primary/20 transition-all duration-500 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2">
              {/* Card Decoration */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-[0.03] group-hover:opacity-[0.08] transition-opacity -translate-y-1/2 translate-x-1/2 rounded-full ${idx % 2 === 0 ? 'from-primary to-transparent' : 'from-secondary to-transparent'}`}></div>

              <div className="p-8 flex flex-col h-full">
                <div className="flex items-start justify-between mb-8">
                  <div 
                    className="relative cursor-pointer group/avatar"
                    onClick={() => navigate(`/profile/${u._id}`)}
                  >
                    <div className="w-20 h-20 rounded-[2rem] overflow-hidden bg-surface-container ring-4 ring-white group-hover/avatar:ring-primary transition-all shadow-xl relative z-10">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.fullname?.firstname}`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full border-4 border-white z-20"></div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 bg-secondary/10 text-secondary px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter">
                      <Star size={10} fill="currentColor" /> 4.9 ({Math.floor(Math.random() * 50) + 10})
                    </div>
                    {idx % 4 === 0 && (
                      <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter">
                        <Zap size={10} fill="currentColor" /> Top Rated
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 
                    className="font-bold text-2xl mb-1 leading-tight hover:text-primary transition-colors cursor-pointer"
                    onClick={() => navigate(`/profile/${u._id}`)}
                  >
                    {u.fullname?.firstname} {u.fullname?.lastname}
                  </h3>
                  <p className="text-primary font-bold text-xs uppercase tracking-widest">{u.role}</p>
                </div>

                <p className="text-on-surface-variant text-sm mb-8 line-clamp-3 leading-relaxed font-medium">
                  {u.bio || "Passionate about knowledge sharing and collaborative learning. Ready to swap skills!"}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {u.skillsOffered?.slice(0, 3).map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-xl bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-wider border border-outline-variant/30 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
                      {skill}
                    </span>
                  ))}
                  {u.skillsOffered?.length > 3 && (
                    <span className="px-2 py-1.5 rounded-xl bg-surface-container-high text-on-surface-variant text-[10px] font-bold">
                      +{u.skillsOffered.length - 3}
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-6 border-t border-outline-variant/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-on-surface-variant font-bold text-[10px] uppercase tracking-widest">
                    <MapPin size={14} className="text-primary" />
                    <span>{u.location || "Remote"}</span>
                  </div>
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest hover:gap-3 transition-all"
                  >
                    Propose Swap <ArrowUpRight size={18} />
                  </button>
                </div>
              </div>

              {/* Hover Overlay Button (Visible on hover) */}
              <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                <button
                  onClick={() => setSelectedUser(u)}
                  className="bg-white text-primary px-8 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-2xl scale-90 group-hover:scale-100 transition-all hover:bg-surface-container"
                >
                  Connect with {u.fullname?.firstname}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Swap Request Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="headline-sm text-2xl">Propose a Swap</h2>
              <button onClick={() => setSelectedUser(null)} className="text-on-surface-variant hover:text-on-surface">
                <X size={24} />
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl mb-6">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.fullname?.firstname}`} className="w-12 h-12 rounded-xl" alt="" />
              <div>
                <p className="font-bold">Swap with {selectedUser.fullname?.firstname}</p>
                <p className="text-xs text-primary font-bold uppercase">{selectedUser.role}</p>
              </div>
            </div>

            <form onSubmit={handleRequestSwap} className="space-y-4">
              <div>
                <label className="label-md mb-2 block font-bold">What skill are you offering?</label>
                <input
                  type="text"
                  value={swapData.offersSkill}
                  onChange={(e) => setSwapData({ ...swapData, offersSkill: e.target.value })}
                  required
                  placeholder="e.g. React Development"
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="label-md mb-2 block font-bold">What skill do you want to learn?</label>
                <input
                  type="text"
                  value={swapData.requestsSkill}
                  onChange={(e) => setSwapData({ ...swapData, requestsSkill: e.target.value })}
                  required
                  placeholder="e.g. Italian Language"
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 ring-primary/20 outline-none"
                />
              </div>
              <button type="submit" className="w-full btn btn-primary py-3 justify-center mt-4">
                Send Request
              </button>
            </form>
          </div>
        </div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <div className="py-24 text-center">
          <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6 text-on-surface-variant">
            <Search size={32} />
          </div>
          <h3 className="headline-sm mb-2">No results found</h3>
          <p className="text-on-surface-variant">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
