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
  BookOpen,
  Video,
  Download,
  ExternalLink,
  Globe,
  CalendarCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVideoCall } from '../context/VideoCallContext';
import { swapService } from '../services/swapService';
import { aiService } from '../services/aiService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  generateGoogleCalendarUrl, 
  downloadIcsFile, 
  formatSessionDate, 
  getSessionCountdown 
} from '../utils/calendar';

const TIME_SLOTS = [
  { time: '10:00', label: '10:00 AM' },
  { time: '11:30', label: '11:30 AM' },
  { time: '14:00', label: '02:00 PM' },
  { time: '16:00', label: '04:00 PM' },
  { time: '18:00', label: '06:00 PM' },
  { time: '19:30', label: '07:30 PM' }
];

const Dashboard = () => {
  const { user } = useAuth();
  const { startCall } = useVideoCall();
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

  // Reschedule Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('14:00');
  const [rescheduleDuration, setRescheduleDuration] = useState(45);
  const [rescheduling, setRescheduling] = useState(false);

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
      const res = await aiService.generateCurriculum({
        skillToLearn: swap.skillOffered,
        skillToTeach: swap.requestedSkill,
        partnerName
      });
      if (res.data?.curriculum) {
        setCurriculumData(res.data.curriculum);
      }
    } catch (err) {
      toast.error('Failed to generate study plan');
    } finally {
      setCurriculumLoading(false);
    }
  };

  const handleCopyCurriculum = () => {
    if (!curriculumData) return;
    const text = `4-Week Exchange Plan:\n${curriculumData.weeklyPlan?.map(w => `Week ${w.week}: ${w.focus}\n- ${w.actionItems.join('\n- ')}`).join('\n\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Syllabus copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Reschedule handlers
  const handleOpenReschedule = (swap) => {
    setRescheduleTarget(swap);
    const existingDate = swap.scheduledTime ? new Date(swap.scheduledTime).toISOString().split('T')[0] : '';
    setRescheduleDate(existingDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setRescheduleSlot(swap.scheduledTime ? new Date(swap.scheduledTime).toTimeString().substring(0, 5) : '14:00');
    setRescheduleDuration(swap.durationMinutes || 45);
    setRescheduleModalOpen(true);
  };

  const handleSaveReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleTarget || !rescheduleDate) return;
    setRescheduling(true);
    try {
      const scheduledTime = new Date(`${rescheduleDate}T${rescheduleSlot}:00`).toISOString();
      await swapService.rescheduleSwap({
        swapId: rescheduleTarget.swapId,
        scheduledTime,
        durationMinutes: rescheduleDuration
      });
      toast.success('Session rescheduled successfully!');
      setRescheduleModalOpen(false);
      fetchSwaps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reschedule session');
    } finally {
      setRescheduling(false);
    }
  };

  // Find next upcoming scheduled session
  const upcomingSessions = acceptedSwaps
    .filter(s => s.scheduledTime)
    .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

  const nextUpcomingSession = upcomingSessions.find(s => {
    const end = new Date(new Date(s.scheduledTime).getTime() + (s.durationMinutes || 30) * 60 * 1000);
    return end > new Date();
  }) || upcomingSessions[0];

  const nextCountdown = nextUpcomingSession ? getSessionCountdown(nextUpcomingSession.scheduledTime, nextUpcomingSession.durationMinutes) : null;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-[rgba(255,255,255,0.12)] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase text-[#FFEEA8] font-semibold tracking-wider">
              Workspace
            </span>
            <span className="tag-chip text-[9px] py-0 px-1.5 font-mono bg-[#2B3F74] text-[#FFEEA8]">
              RECIPROCAL EXCHANGE
            </span>
          </div>
          <h1 className="heading-h1 text-[#F7F8FC] mt-0.5">
            Dashboard
          </h1>
          <p className="body-md text-sm text-[#A4B0C6] mt-1">
            Track ongoing swaps, schedule upcoming 1:1 sessions, and manage peer milestones.
          </p>
        </div>

        <button 
          onClick={() => navigate('/marketplace')}
          className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5 self-start sm:self-auto rounded-xl"
        >
          <span>Find New Partner</span>
          <ArrowRight size={14} />
        </button>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3): Stats, Incoming, Active Swaps */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                code: "PENDING",
                label: "Incoming Requests",
                value: pendingSwaps.length,
                badge: pendingSwaps.length > 0 ? "ACTION REQ" : "UP TO DATE",
                isAction: pendingSwaps.length > 0
              },
              {
                code: "ACTIVE",
                label: "Active Swaps",
                value: acceptedSwaps.filter(s => s.status !== 'completed').length,
                badge: "ONGOING",
                isAction: false
              },
              {
                code: "CREDITS",
                label: "Swap Credits",
                value: user?.credits !== undefined ? user.credits : 3,
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
                      ? 'bg-[rgba(215,46,43,0.15)] text-[#D72E2B] border-[rgba(215,46,43,0.4)]' 
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
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#2B3F74] text-white font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {swap.fromUser?.fullname?.firstname?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base text-[#F7F8FC]">
                          {swap.fromUser?.fullname?.firstname} {swap.fromUser?.fullname?.lastname}
                        </h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono mt-0.5">
                          <span className="text-[#FFEEA8]">Offers: {swap.offersSkill}</span>
                          <span className="text-[#A4B0C6]">Requests: {swap.requestsSkill}</span>
                        </div>

                        {/* Proposed Session Slot */}
                        {swap.scheduledTime && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#202738] border border-[rgba(255,238,168,0.25)] text-[11px] font-mono text-[#FFEEA8]">
                            <Calendar size={12} className="text-[#FFEEA8]" />
                            <span>Proposed Slot: {formatSessionDate(swap.scheduledTime)} ({swap.durationMinutes || 30}m)</span>
                          </div>
                        )}

                        {swap.proposalNotes && (
                          <p className="text-xs text-[#A4B0C6] italic mt-2 line-clamp-2">
                            "{swap.proposalNotes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                      <button
                        onClick={() => handleAccept(swap._id)}
                        className="btn btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 rounded-xl"
                      >
                        <UserCheck size={13} />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleReject(swap._id)}
                        className="btn btn-secondary text-xs py-1.5 px-3 text-[#D72E2B] border-[rgba(215,46,43,0.35)] hover:bg-[rgba(215,46,43,0.1)] rounded-xl"
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
                const hasSchedule = Boolean(swap.scheduledTime);
                const countdown = hasSchedule ? getSessionCountdown(swap.scheduledTime, swap.durationMinutes) : null;

                const googleCalUrl = hasSchedule ? generateGoogleCalendarUrl({
                  title: `SkillSwap: ${swap.skillOffered} ⇄ ${swap.requestedSkill} with ${partner?.fullname?.firstname || 'Partner'}`,
                  description: swap.proposalNotes || `Skill exchange between ${user?.fullname?.firstname || 'You'} and ${partner?.fullname?.firstname || 'Partner'}`,
                  startTime: swap.scheduledTime,
                  durationMinutes: swap.durationMinutes || 30,
                  locationUrl: window.location.origin + '/messages'
                }) : '#';

                return (
                  <div
                    key={key}
                    className="ui-card p-5 bg-[#283144] border border-[rgba(255,255,255,0.12)] flex flex-col justify-between hover:border-[#2B3F74] rounded-2xl transition-all shadow-md"
                  >
                    <div>
                      {/* Partner Head */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#2B3F74] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.15)]">
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
                          onClick={() => navigate('/messages', { state: { partnerId: partner?._id } })}
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

                      {/* Schedule Strip & Calendar Actions */}
                      <div className="mb-4 p-3 rounded-xl bg-[#202738] border border-[rgba(255,255,255,0.08)]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono text-[#A4B0C6] uppercase font-semibold flex items-center gap-1">
                            <Clock size={11} className="text-[#FFEEA8]" /> Session Slot
                          </span>
                          {countdown && (
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                              countdown.isLive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                                : 'bg-[#171D2B] text-[#FFEEA8] border border-[rgba(255,238,168,0.2)]'
                            }`}>
                              {countdown.label}
                            </span>
                          )}
                        </div>

                        {hasSchedule ? (
                          <div>
                            <p className="text-xs font-bold text-[#F7F8FC]">
                              {formatSessionDate(swap.scheduledTime)} ({swap.durationMinutes || 30}m)
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              <a
                                href={googleCalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-mono px-2 py-1 rounded-lg bg-[#171D2B] text-[#FFEEA8] hover:text-white border border-[rgba(255,238,168,0.2)] flex items-center gap-1"
                              >
                                <ExternalLink size={10} />
                                <span>Google Cal</span>
                              </a>
                              <button
                                onClick={() => downloadIcsFile({
                                  title: `SkillSwap: ${swap.skillOffered} ⇄ ${swap.requestedSkill}`,
                                  description: swap.proposalNotes || '',
                                  startTime: swap.scheduledTime,
                                  durationMinutes: swap.durationMinutes || 30,
                                  locationUrl: window.location.origin + '/messages',
                                  filename: `skillswap-${(partner?.fullname?.firstname || 'session').toLowerCase()}.ics`
                                })}
                                className="text-[10px] font-mono px-2 py-1 rounded-lg bg-[#171D2B] text-[#A4B0C6] hover:text-white border border-[rgba(255,255,255,0.1)] flex items-center gap-1"
                              >
                                <Download size={10} />
                                <span>.ics</span>
                              </button>
                              <button
                                onClick={() => handleOpenReschedule(swap)}
                                className="text-[10px] font-mono px-2 py-1 rounded-lg bg-[#171D2B] text-[#A4B0C6] hover:text-white border border-[rgba(255,255,255,0.1)]"
                              >
                                Reschedule
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-[#71809B] italic font-mono">No slot scheduled</span>
                            <button
                              onClick={() => handleOpenReschedule(swap)}
                              className="btn btn-primary text-[11px] py-1.5 px-3 rounded-lg flex items-center gap-1.5 text-[#FFEEA8] font-semibold"
                            >
                              <Calendar size={12} />
                              <span>Schedule Session</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.1)]">
                      <button
                        onClick={() => handleOpenCurriculum(swap)}
                        className="w-full btn btn-secondary text-xs py-2 px-3 font-mono flex items-center justify-center gap-1.5 rounded-xl"
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
                        <div className="py-1 text-center text-xs font-mono text-[#FFEEA8] bg-[#202738] rounded-xl border border-[rgba(255,238,168,0.3)]">
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
                  <button onClick={() => navigate('/marketplace')} className="btn btn-primary text-xs py-2 px-4 rounded-xl">
                    Find a Partner
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar: Next Session & Honor Code */}
        <div className="space-y-6">
          
          {/* Next 1:1 Session Widget */}
          <div className="ui-card p-6 bg-[#202738] border border-[rgba(255,238,168,0.3)] rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#A4B0C6] uppercase font-semibold">
                Upcoming Session
              </span>
              {nextCountdown && (
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  nextCountdown.isLive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                    : 'bg-[#2B3F74] text-[#FFEEA8] border border-[rgba(255,238,168,0.3)]'
                }`}>
                  {nextCountdown.label}
                </span>
              )}
            </div>

            {nextUpcomingSession ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#2B3F74] text-white font-mono font-bold flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.15)]">
                    {nextUpcomingSession.otherUser?.fullname?.firstname?.[0] || 'P'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#F7F8FC] truncate">
                      {nextUpcomingSession.otherUser?.fullname?.firstname} {nextUpcomingSession.otherUser?.fullname?.lastname}
                    </p>
                    <p className="text-xs text-[#A4B0C6] truncate">
                      {nextUpcomingSession.otherUser?.role || 'Skill Mentor'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#171D2B] border border-[rgba(255,255,255,0.08)]">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#FFEEA8] mb-0.5">
                    <Calendar size={13} />
                    <span className="font-bold">{formatSessionDate(nextUpcomingSession.scheduledTime)}</span>
                  </div>
                  <p className="text-[11px] text-[#A4B0C6]">
                    Duration: {nextUpcomingSession.durationMinutes || 30} minutes
                  </p>
                </div>

                <button
                  onClick={() => startCall(nextUpcomingSession.otherUser)}
                  className="w-full btn btn-cta text-xs py-2.5 font-semibold flex items-center justify-center gap-2 rounded-xl"
                >
                  <Video size={15} />
                  <span>Join Video Call Room</span>
                </button>

                <div className="flex gap-2">
                  <a
                    href={generateGoogleCalendarUrl({
                      title: `SkillSwap with ${nextUpcomingSession.otherUser?.fullname?.firstname || 'Partner'}`,
                      description: nextUpcomingSession.proposalNotes || '',
                      startTime: nextUpcomingSession.scheduledTime,
                      durationMinutes: nextUpcomingSession.durationMinutes || 30,
                      locationUrl: window.location.origin + '/messages'
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn btn-secondary text-[11px] py-1.5 flex items-center justify-center gap-1 rounded-lg"
                  >
                    <ExternalLink size={12} className="text-[#FFEEA8]" />
                    <span>Google Cal</span>
                  </a>
                  <button
                    onClick={() => downloadIcsFile({
                      title: `SkillSwap with ${nextUpcomingSession.otherUser?.fullname?.firstname || 'Partner'}`,
                      description: nextUpcomingSession.proposalNotes || '',
                      startTime: nextUpcomingSession.scheduledTime,
                      durationMinutes: nextUpcomingSession.durationMinutes || 30,
                      locationUrl: window.location.origin + '/messages',
                      filename: `skillswap-session.ics`
                    })}
                    className="flex-1 btn btn-secondary text-[11px] py-1.5 flex items-center justify-center gap-1 rounded-lg"
                  >
                    <Download size={12} className="text-[#FFEEA8]" />
                    <span>Save .ics</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <CalendarCheck size={28} className="mx-auto text-[#FFEEA8]" />
                <p className="text-xs text-[#A4B0C6]">No upcoming session scheduled yet</p>
                {acceptedSwaps.length > 0 ? (
                  <button
                    onClick={() => handleOpenReschedule(acceptedSwaps[0])}
                    className="w-full btn btn-cta text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-semibold"
                  >
                    <Calendar size={14} />
                    <span>Schedule Next 1:1 Session</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/marketplace')}
                    className="w-full btn btn-primary text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <ArrowRight size={14} />
                    <span>Find a Swap Partner</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Honor Code & Guidelines */}
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

      {/* Reschedule Modal */}
      {rescheduleModalOpen && rescheduleTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="z-[300] ui-card rounded-2xl max-w-md w-full p-6 bg-[#283144] border border-[rgba(255,255,255,0.15)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.1)]">
              <div>
                <span className="font-mono text-[10px] text-[#FFEEA8] uppercase font-semibold">Coordinate Time</span>
                <h3 className="heading-h2 text-base text-[#F7F8FC]">
                  Reschedule with {rescheduleTarget.otherUser?.fullname?.firstname || 'Partner'}
                </h3>
              </div>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#171D2B] text-[#A4B0C6] hover:text-[#F7F8FC]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] text-[#A4B0C6] uppercase font-semibold block mb-1.5">Pick New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="input-field w-full py-2 px-3 text-xs rounded-xl bg-[#171D2B]"
                  required
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-[#A4B0C6] uppercase font-semibold block mb-1.5">Select Time Slot</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      onClick={() => setRescheduleSlot(s.time)}
                      className={`p-2 rounded-xl text-center border text-xs font-semibold ${
                        rescheduleSlot === s.time
                          ? 'bg-[#2B3F74] text-white border-[#FFEEA8]'
                          : 'bg-[#171D2B] text-[#A4B0C6] border-[rgba(255,255,255,0.08)]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] text-[#A4B0C6] uppercase font-semibold block mb-1.5">Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setRescheduleDuration(mins)}
                      className={`p-2 rounded-xl text-center border text-xs font-semibold ${
                        rescheduleDuration === mins
                          ? 'bg-[#2B3F74] text-white border-[#FFEEA8]'
                          : 'bg-[#171D2B] text-[#A4B0C6] border-[rgba(255,255,255,0.08)]'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="flex-1 btn btn-secondary text-xs py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="flex-1 btn btn-primary text-xs py-2 rounded-xl"
                >
                  {rescheduling ? 'Saving...' : 'Update Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Curriculum Modal */}
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
              {curriculumLoading ? (
                <div className="space-y-4 py-8">
                  <div className="h-4 w-1/3 bg-[#202738] rounded-md skeleton-shimmer" />
                  <div className="h-16 w-full bg-[#202738] rounded-xl skeleton-shimmer" />
                  <div className="h-16 w-full bg-[#202738] rounded-xl skeleton-shimmer" />
                  <div className="h-16 w-full bg-[#202738] rounded-xl skeleton-shimmer" />
                </div>
              ) : curriculumData ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-[#202738] border border-[rgba(255,255,255,0.08)]">
                    <p className="font-mono text-[10px] text-[#A4B0C6] uppercase">Overview</p>
                    <p className="text-sm font-semibold text-[#F7F8FC] mt-0.5">{curriculumData.overview}</p>
                  </div>

                  <div className="space-y-3">
                    {curriculumData.weeklyPlan?.map((week) => (
                      <div key={week.week} className="p-4 rounded-xl bg-[#202738] border border-[rgba(255,255,255,0.08)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#FFEEA8]">WEEK 0{week.week}</span>
                          <span className="tag-chip text-[9px]">MILESTONE</span>
                        </div>
                        <h4 className="font-bold text-sm text-[#F7F8FC]">{week.focus}</h4>
                        <ul className="text-xs text-[#A4B0C6] space-y-1 list-disc list-inside">
                          {week.actionItems?.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#A4B0C6] text-center py-8">No plan generated.</p>
              )}
            </div>

            <div className="p-4 border-t border-[rgba(255,255,255,0.1)] bg-[#202738] flex justify-between items-center">
              <button
                onClick={handleCopyCurriculum}
                disabled={!curriculumData}
                className="btn btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 rounded-xl"
              >
                {copied ? <Check size={14} className="text-[#FFEEA8]" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Syllabus'}</span>
              </button>
              <button
                onClick={() => setCurriculumModalOpen(false)}
                className="btn btn-primary text-xs py-2 px-4 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
