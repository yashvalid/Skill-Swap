import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  ArrowRight,
  Calendar,
  Zap,
  TrendingUp,
  XCircle,
  UserCheck,
  Sparkles,
  X,
  Copy,
  Check,
  Award,
  Layers,
  ArrowLeftRight,
  Shield,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { swapService } from '../services/swapService';
import { aiService } from '../services/aiService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingSwaps, setPendingSwaps] = useState([]);
  const [acceptedSwaps, setAcceptedSwaps] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Curriculum Modal State
  const [curriculumModalOpen, setCurriculumModalOpen] = useState(false);
  const [activeCurriculumSwap, setActiveCurriculumSwap] = useState(null);
  const [curriculumData, setCurriculumData] = useState(null);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
      toast.success('Swap request accepted! Added to active swaps.');
      fetchSwaps();
    } catch (error) {
      toast.error('Failed to accept swap');
    }
  };

  const handleReject = async (id) => {
    try {
      await swapService.rejectSwap(id);
      toast.success('Swap request declined');
      fetchSwaps();
    } catch (error) {
      toast.error('Failed to decline swap');
    }
  };

  const handleCompleteSwap = async (id) => {
    try {
      await swapService.completeSwap(id);
      toast.success('Milestone certified! Reputation credit updated.');
      fetchSwaps();
    } catch (error) {
      toast.error('Failed to certify swap');
    }
  };

  const handleOpenCurriculum = async (swap) => {
    setActiveCurriculumSwap(swap);
    setCurriculumModalOpen(true);
    setCurriculumLoading(true);
    setCurriculumData(null);
    setCopied(false);

    try {
      const partnerName = swap.otherUser?.fullname?.firstname || 'Partner';
      const response = await aiService.generateCurriculum({
        skillToLearn: swap.skillOffered,
        skillToTeach: swap.requestedSkill,
        partnerName
      });

      if (response.data?.curriculum) {
        setCurriculumData(response.data.curriculum);
      } else {
        throw new Error('Invalid curriculum response');
      }
    } catch (error) {
      toast.error('Could not load AI curriculum');
      setCurriculumModalOpen(false);
    } finally {
      setCurriculumLoading(false);
    }
  };

  const handleCopyCurriculum = () => {
    if (!curriculumData) return;
    const textToCopy = `${curriculumData.title}
${curriculumData.summary}
Schedule: ${curriculumData.recommendedSessionCadence}

` + curriculumData.weeks.map(w => (
      `Week ${w.week}: ${w.focus}
- Learn: ${w.learnTopic}
- Teach: ${w.teachTopic}
- Milestone: ${w.milestoneExercise}`
    )).join('\n\n');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Syllabus copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-6">
        <div className="ui-card p-8 bg-[#283144] border border-[rgba(255,255,255,0.12)] rounded-2xl">
          <h3 className="heading-h2 text-[#F7F8FC] mb-2">Authentication Required</h3>
          <p className="body-md text-xs text-[#A4B0C6] mb-6">
            Sign in to view your learning dashboard and pending swap requests.
          </p>
          <button onClick={() => navigate('/login')} className="btn btn-primary w-full py-2.5">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 pb-6 border-b border-[rgba(255,255,255,0.12)] gap-4">
        <div>
          <span className="font-mono text-xs uppercase text-[#FFEEA8] font-semibold tracking-wider">
            Dashboard
          </span>
          <h1 className="heading-h1 text-[#F7F8FC] mt-1">
            Welcome back, {user.fullname?.firstname}
          </h1>
          <p className="body-md text-sm text-[#A4B0C6] mt-1">
            <span className="font-mono font-bold text-[#F7F8FC]">{acceptedSwaps.length}</span> active swaps •{' '}
            <span className="font-mono font-bold text-[#F7F8FC]">{pendingSwaps.length}</span> incoming requests
          </p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => navigate('/marketplace')} className="btn btn-cta text-xs py-2 px-4">
            Discover Mentors
          </button>
          <button onClick={() => navigate('/messages')} className="btn btn-secondary text-xs py-2 px-4">
            Open Chat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Metric Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                code: "PENDING",
                label: "Incoming Requests",
                value: pendingSwaps.length,
                badge: pendingSwaps.length > 0 ? "ACTION REQ" : "CLEAR",
                isAction: pendingSwaps.length > 0
              },
              {
                code: "ACTIVE",
                label: "Active Swaps",
                value: acceptedSwaps.length,
                badge: "ONGOING",
                isAction: false
              },
              {
                code: "CREDITS",
                label: "Swap Credits",
                value: user.credits !== undefined ? user.credits : 3,
                badge: "+1 PER SWAP",
                isAction: false
              }
            ].map((stat, i) => (
              <div
                key={i}
                className="ui-card p-5 bg-[#283144] border border-[rgba(255,255,255,0.12)] rounded-2xl"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono text-[10px] text-[#A4B0C6]">{stat.code}</span>
                  <span className={`font-mono text-[9px] font-semibold px-2 py-0.5 rounded-xl border ${
                    stat.isAction 
                      ? 'bg-[rgba(215, 46, 43,0.15)] text-[#D72E2B] border-[rgba(215, 46, 43,0.4)]' 
                      : 'bg-[#202738] text-[#A4B0C6] border-[rgba(255,255,255,0.1)]'
                  }`}>
                    {stat.badge}
                  </span>
                </div>
                <p className="font-mono text-xs uppercase text-[#A4B0C6] mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-[#F7F8FC]">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Incoming Swap Requests */}
          {pendingSwaps.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[#FFA502]">Action Required •</span>
                <h2 className="heading-h2 text-base text-[#F7F8FC]">Incoming Requests ({pendingSwaps.length})</h2>
              </div>

              <div className="space-y-3">
                {pendingSwaps.map((swap) => (
                  <div
                    key={swap._id}
                    className="ui-card p-5 bg-[#283144] border-2 border-[rgba(255,165,2,0.5)] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between rounded-2xl"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-[#2B3F74] text-white font-mono font-bold flex items-center justify-center shrink-0">
                        {swap.fromUser?.fullname?.firstname?.[0] || 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-[#F7F8FC]">
                          {swap.fromUser?.fullname?.firstname} {swap.fromUser?.fullname?.lastname}
                        </h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono mt-0.5">
                          <span className="text-[#FFEEA8]">Offers: {swap.offersSkill}</span>
                          <span className="text-[#A4B0C6]">Requests: {swap.requestsSkill}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleAccept(swap._id)}
                        className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <UserCheck size={13} />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleReject(swap._id)}
                        className="btn btn-secondary text-xs py-1.5 px-3 text-[#D72E2B] border-[rgba(215, 46, 43,0.35)] hover:bg-[rgba(215, 46, 43,0.1)]"
                      >
                        <XCircle size={13} />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active Skill Swaps */}
          <section className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[rgba(255,255,255,0.12)]">
              <div>
                <span className="font-mono text-xs text-[#FFEEA8] uppercase font-semibold">Swaps</span>
                <h2 className="heading-h2 text-base text-[#F7F8FC]">Active Skill Swaps</h2>
              </div>
              <button
                onClick={() => navigate('/marketplace')}
                className="font-mono text-xs text-[#FFEEA8] hover:underline flex items-center gap-1"
              >
                <span>Browse more</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acceptedSwaps.map((swap) => {
                const partner = swap.otherUser;
                const key = swap.swapId || swap._id || (partner && partner._id);
                const isCompleted = swap.status === 'completed';

                return (
                  <div
                    key={key}
                    className="ui-card p-5 bg-[#283144] border border-[rgba(255,255,255,0.12)] flex flex-col justify-between hover:border-[#2B3F74] rounded-2xl"
                  >
                    <div>
                      {/* Partner Head */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-full bg-[#2B3F74] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {partner?.fullname?.firstname?.[0] || 'P'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#F7F8FC] truncate">
                            {partner?.fullname?.firstname} {partner?.fullname?.lastname}
                          </p>
                          <span className="font-mono text-[10px] text-[#A4B0C6]">
                            {isCompleted ? 'MILESTONE COMPLETED' : 'ACTIVE RECIPROCAL TRACK'}
                          </span>
                        </div>
                        <button
                          onClick={() => navigate('/messages')}
                          className="p-2 rounded-xl hover:bg-[#202738] text-[#A4B0C6] hover:text-[#F7F8FC] transition-colors"
                          title="Message partner"
                        >
                          <MessageSquare size={15} />
                        </button>
                      </div>

                      {/* Learning / Teaching Pills */}
                      <div className="space-y-2 mb-4 text-xs font-mono">
                        <div className="p-2.5 rounded-xl bg-[#202738] border border-[rgba(255,255,255,0.08)]">
                          <span className="text-[10px] uppercase text-[#FFEEA8] block font-semibold">You Learn</span>
                          <p className="text-[#F7F8FC] font-medium mt-0.5">{swap.skillOffered}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#171D2B] border border-[rgba(255,255,255,0.08)]">
                          <span className="text-[10px] uppercase text-[#A4B0C6] block font-semibold">You Teach</span>
                          <p className="text-[#F7F8FC] font-medium mt-0.5">{swap.requestedSkill}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.1)]">
                      <button
                        onClick={() => handleOpenCurriculum(swap)}
                        className="w-full btn btn-secondary text-xs py-2 px-3 font-mono flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={13} className="text-[#FFEEA8]" />
                        <span>AI 4-Week Study Syllabus</span>
                      </button>

                      {!isCompleted ? (
                        <button
                          onClick={() => handleCompleteSwap(swap.swapId)}
                          className="w-full py-1.5 px-3 rounded-xl text-xs font-mono text-[#A4B0C6] hover:text-[#FFEEA8] hover:bg-[#202738] transition-colors border border-dashed border-[rgba(255,255,255,0.15)] flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 size={13} className="text-[#FFEEA8]" />
                          <span>Mark Milestone Done (+1 Credit)</span>
                        </button>
                      ) : (
                        <div className="py-1 text-center text-xs font-mono text-[#FFEEA8] bg-[#202738] rounded-xl border border-[rgba(255, 238, 168,0.3)]">
                          Milestone Complete • +1 Credit Earned
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {acceptedSwaps.length === 0 && (
                <div className="md:col-span-2 p-8 text-center ui-card bg-[#202738] border-dashed border-[rgba(255,255,255,0.15)] rounded-2xl">
                  <p className="font-mono text-xs text-[#A4B0C6] mb-3">
                    No active swaps yet
                  </p>
                  <button onClick={() => navigate('/marketplace')} className="btn btn-primary text-xs py-2 px-4">
                    Find a Partner
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar: Next Session & Honor Code */}
        <div className="space-y-6">
          <div className="ui-card p-6 bg-[#202738] border border-[rgba(255,255,255,0.12)] rounded-2xl">
            <span className="font-mono text-[10px] text-[#A4B0C6] uppercase font-semibold block mb-2">
              Upcoming Session
            </span>
            <h3 className="heading-h2 text-base text-[#F7F8FC] mb-1">Next 1:1 Session</h3>
            <p className="font-mono text-3xl font-bold text-[#F7F8FC] mb-1">14:00 UTC</p>
            <p className="text-xs text-[#A4B0C6] mb-5">
              Live pair session with your swap partner
            </p>
            <button
              onClick={() => navigate('/messages')}
              className="w-full btn btn-primary text-xs py-2.5 font-semibold"
            >
              Open Chat
            </button>
          </div>

          <div className="ui-card p-6 bg-[#283144] border border-[rgba(255,255,255,0.12)] space-y-3 rounded-2xl">
            <span className="font-mono text-xs text-[#FFEEA8] uppercase font-semibold">Community Guidelines</span>
            <h3 className="heading-h2 text-sm text-[#F7F8FC]">Honor Code</h3>
            <ul className="text-xs text-[#A4B0C6] space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-[#FFEEA8] shrink-0 mt-0.5" />
                <span>Both partners share knowledge reciprocally with zero monetary fees.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-[#FFEEA8] shrink-0 mt-0.5" />
                <span>Complete weekly milestones to maintain verified standing.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-[#FFEEA8] shrink-0 mt-0.5" />
                <span>Earn 1 Reputation Credit for each verified completion.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* AI Curriculum Modal: z-index overlay (200), modal (300) per DESIGN.md */}
      {curriculumModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="z-[300] ui-card rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden bg-[#283144] border border-[rgba(255,255,255,0.15)] shadow-2xl">
            <div className="p-5 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between bg-[#202738]">
              <div>
                <span className="font-mono text-[10px] text-[#FFEEA8] uppercase font-semibold">
                  Reciprocal Roadmap
                </span>
                <h3 className="heading-h2 text-lg text-[#F7F8FC]">4-Week Study Syllabus</h3>
              </div>
              <button
                onClick={() => setCurriculumModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#171D2B] text-[#A4B0C6] hover:text-[#F7F8FC]"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-grow">
              {/* Shimmer Skeleton (No circular spinners per DESIGN.md) */}
              {curriculumLoading ? (
                <div className="py-8 space-y-4">
                  <div className="h-6 w-3/4 skeleton-shimmer" />
                  <div className="h-16 w-full skeleton-shimmer" />
                  <div className="h-24 w-full skeleton-shimmer" />
                  <div className="h-24 w-full skeleton-shimmer" />
                </div>
              ) : curriculumData ? (
                <>
                  <div className="p-4 rounded-xl bg-[#202738] border border-[rgba(255,255,255,0.08)] space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-base text-[#F7F8FC]">{curriculumData.title}</h4>
                      <span className="tag-chip text-[10px]">
                        Schedule: {curriculumData.recommendedSessionCadence}
                      </span>
                    </div>
                    <p className="body-md text-xs text-[#A4B0C6] leading-relaxed">
                      {curriculumData.summary}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <span className="font-mono text-xs text-[#A4B0C6] uppercase font-semibold block">
                      Weekly Schedule & Milestones
                    </span>

                    {curriculumData.weeks?.map((week) => (
                      <div
                        key={week.week}
                        className="p-4 rounded-xl bg-[#202738] border border-[rgba(255,255,255,0.08)] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="tag-chip text-[10px]">
                            Week {week.week}
                          </span>
                          <span className="font-bold text-sm text-[#F7F8FC]">
                            {week.focus}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2.5 rounded-xl bg-[#171D2B] border border-[rgba(255,255,255,0.06)]">
                            <span className="text-[10px] text-[#FFEEA8] block font-semibold">Learn Topic:</span>
                            <p className="text-[#F7F8FC] mt-0.5">{week.learnTopic}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#171D2B] border border-[rgba(255,255,255,0.06)]">
                            <span className="text-[10px] text-[#A4B0C6] block font-semibold">Teach Topic:</span>
                            <p className="text-[#F7F8FC] mt-0.5">{week.teachTopic}</p>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#171D2B] text-xs flex items-start gap-2 border border-[rgba(255,255,255,0.06)]">
                          <CheckCircle2 size={14} className="text-[#FFEEA8] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-mono font-bold text-[#F7F8FC]">Milestone: </span>
                            <span className="text-[#A4B0C6]">{week.milestoneExercise}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {curriculumData && (
              <div className="p-4 px-6 border-t border-[rgba(255,255,255,0.1)] flex items-center justify-between bg-[#202738]">
                <button
                  onClick={handleCopyCurriculum}
                  className="btn btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 font-mono"
                >
                  {copied ? <Check size={13} className="text-[#FFEEA8]" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy Syllabus'}</span>
                </button>
                <button
                  onClick={() => setCurriculumModalOpen(false)}
                  className="btn btn-primary py-2 px-5 text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
