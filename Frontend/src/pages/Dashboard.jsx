import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  ArrowRight,
  Calendar,
  Zap,
  MoreHorizontal,
  TrendingUp,
  XCircle,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { swapService } from '../services/swapService';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [pendingSwaps, setPendingSwaps] = useState([]);
  const [acceptedSwaps, setAcceptedSwaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSwaps();
    }
  }, [user]);

  const fetchSwaps = async () => {
    try {
      const [pendingRes, acceptedRes] = await Promise.all([
        swapService.getPendingSwaps(),
        swapService.getAcceptedSwaps()
      ]);
      setPendingSwaps(pendingRes.data.pendingSwaps || []);
      setAcceptedSwaps(acceptedRes.data.allUsers || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await swapService.acceptSwap(id);
      toast.success('Swap accepted!');
      fetchSwaps();
    } catch (error) {
      toast.error('Failed to accept swap');
    }
  };

  const handleReject = async (id) => {
    try {
      await swapService.rejectSwap(id);
      toast.success('Swap rejected');
      fetchSwaps();
    } catch (error) {
      toast.error('Failed to reject swap');
    }
  };

  if (!user) return <div className="container py-20 text-center">Please login to view your dashboard.</div>;

  return (
    <div className="container py-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="display-lg text-4xl mb-2">Welcome back, <span className="text-primary italic">{user.fullname?.firstname}</span></h1>
          <p className="text-on-surface-variant">You have {acceptedSwaps.length} active swaps and {pendingSwaps.length} pending requests.</p>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-secondary px-6">View History</button>
          <button className="btn btn-primary px-6">Explore More</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Pending Tasks", value: pendingSwaps.length, icon: <Clock className="text-primary" />, trend: "Action required" },
              { label: "Active Swaps", value: acceptedSwaps.length, icon: <TrendingUp className="text-secondary" />, trend: "In progress" },
              { label: "Endorsements", value: "12", icon: <Zap className="text-tertiary" />, trend: "+2" }
            ].map((stat, i) => (
              <div key={i} className="card bg-surface-container-low p-6 border border-transparent hover:border-outline-variant transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-2xl bg-white shadow-sm">
                    {stat.icon}
                  </div>
                  <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-full">{stat.trend}</span>
                </div>
                <h4 className="label-md mb-1">{stat.label}</h4>
                <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Pending Swaps (Inbox) */}
          {pendingSwaps.length > 0 && (
            <div>
              <h2 className="headline-sm mb-6 flex items-center gap-2">
                Swap Requests <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{pendingSwaps.length}</span>
              </h2>
              <div className="space-y-4">
                {pendingSwaps.map((swap) => (
                  <div key={swap._id} className="card bg-white shadow-md border border-primary/20 p-6 flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center overflow-hidden shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${swap.fromUser?.fullname?.firstname}`} alt="" />
                    </div>

                    <div className="flex-grow">
                      <h3 className="font-bold text-lg mb-1">{swap.fromUser?.fullname?.firstname} wants to swap</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant">
                        <span className="flex items-center gap-1"><Zap size={14} className="text-primary" /> Offering: {swap.offersSkill}</span>
                        <span className="flex items-center gap-1"><Clock size={14} className="text-secondary" /> Requesting: {swap.requestsSkill}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleAccept(swap._id)}
                        className="btn btn-primary py-2 px-6 flex items-center gap-2"
                      >
                        <UserCheck size={18} /> Accept
                      </button>
                      <button
                        onClick={() => handleReject(swap._id)}
                        className="btn btn-secondary py-2 px-6 flex items-center gap-2 text-error hover:bg-error/5"
                      >
                        <XCircle size={18} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Swaps */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="headline-sm">Active Partners</h2>
              <button className="text-primary text-sm font-bold flex items-center gap-1">
                Explore <ArrowRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {acceptedSwaps.map((swap) => {
                const partner = swap.otherUser;
                return (
                  <div key={swap._id} className="card bg-surface-container-low p-6 border border-transparent hover:border-primary/10 transition-all">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-sm">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${partner?.fullname?.firstname}`} alt="" />
                      </div>
                      <div>
                        <p className="font-bold">{partner?.fullname?.firstname} {partner?.fullname?.lastname}</p>
                        <p className="text-xs text-on-surface-variant">Active Swap</p>
                      </div>
                      <button className="ml-auto p-2 rounded-full hover:bg-white text-on-surface-variant">
                        <MessageSquare size={18} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-white/50 text-xs">
                        <p className="font-bold uppercase tracking-wider mb-1 opacity-60">You Learn</p>
                        <p className="font-medium text-primary">{swap.skillOffered}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/50 text-xs">
                        <p className="font-bold uppercase tracking-wider mb-1 opacity-60">You Teach</p>
                        <p className="font-medium text-secondary">{swap.requestedSkill}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {acceptedSwaps.length === 0 && (
                <div className="md:col-span-2 p-12 text-center bg-surface-container rounded-3xl border border-dashed border-outline-variant">
                  <p className="text-on-surface-variant italic mb-4">No active swaps yet.</p>
                  <button className="btn btn-secondary">Find your first partner</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Upcoming sessions */}
          <div className="card bg-gradient-to-br from-primary to-primary-container text-white border-none shadow-xl">
            <h2 className="font-bold mb-6 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Calendar size={18} />
              Next Session
            </h2>
            <div className="mb-6">
              <p className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>14:00</p>
              <p className="opacity-90 font-medium">Tomorrow, April 12</p>
            </div>
            <button className="w-full btn bg-white text-primary justify-center font-bold">
              Check Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
