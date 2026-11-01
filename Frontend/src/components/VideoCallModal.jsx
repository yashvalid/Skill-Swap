import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  MonitorUp, 
  MonitorOff, 
  Maximize2, 
  Minimize2, 
  X, 
  Radio, 
  BookOpen, 
  Code, 
  FileText, 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Clock, 
  ArrowRightLeft, 
  Eye, 
  Edit3, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight,
  Loader2,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { useVideoCall } from '../context/VideoCallContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { swapService } from '../services/swapService';
import toast from 'react-hot-toast';

const VideoCallModal = () => {
  const { 
    callStatus, 
    remoteUser, 
    localStream, 
    remoteStream, 
    isMuted, 
    isVideoDisabled, 
    isScreenSharing, 
    callDuration, 
    formatDuration, 
    isAnswering,
    acceptCall, 
    rejectCall, 
    endCall, 
    toggleMic, 
    toggleVideo, 
    toggleScreenShare 
  } = useVideoCall();

  const { socket } = useSocket();
  const { user: currentUser } = useAuth();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isLocalTypingRef = useRef(false);
  const hasPlayedHalfwayCueRef = useRef(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  // Default showStudio to true during ongoing call so both users immediately see the collaborative studio!
  const [showStudio, setShowStudio] = useState(true);
  const [studioTab, setStudioTab] = useState('scratchpad'); // 'scratchpad' | 'agenda'
  const [studioMode, setStudioMode] = useState('notes'); // 'notes' | 'code'
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [showPreview, setShowPreview] = useState(false);

  // Scratchpad Content
  const [studioContent, setStudioContent] = useState(
    '# Pair Learning Session Notes\n\n- Discuss swap objectives\n- Live code walkthrough\n- Next steps & review\n'
  );
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const [lastEditedBy, setLastEditedBy] = useState('');

  // Bilateral Split-Timer & Role
  const [targetDuration, setTargetDuration] = useState(30); // minutes
  const [currentTeacher, setCurrentTeacher] = useState('you'); // 'you' | 'partner'

  // Milestones
  const [milestones, setMilestones] = useState([
    { id: 'm1', title: 'Review fundamentals & goals', completed: true },
    { id: 'm2', title: 'Hands-on practice & code breakdown', completed: false },
    { id: 'm3', title: 'Q&A and knowledge recap', completed: false }
  ]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  // Active Linked Swap (if any)
  const [activeSwap, setActiveSwap] = useState(null);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);

  // Bind local video stream to permanently-mounted video element
  useEffect(() => {
    const video = localVideoRef.current;
    if (video && localStream) {
      if (video.srcObject !== localStream) {
        video.srcObject = localStream;
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, [localStream]);

  // Bind remote video stream to permanently-mounted video element with autoplay safeguard
  useEffect(() => {
    const video = remoteVideoRef.current;
    if (video && remoteStream) {
      if (video.srcObject !== remoteStream) {
        video.srcObject = remoteStream;
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('[WebRTC] Remote video autoplay waiting for user interaction:', err.message);
        });
      }
    }
  }, [remoteStream]);

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Fetch linked active swap record when call begins
  useEffect(() => {
    if (callStatus === 'ongoing' && remoteUser?._id && currentUser?._id) {
      hasPlayedHalfwayCueRef.current = false;
      swapService.getAcceptedSwaps()
        .then(res => {
          const list = res.data?.allUsers || [];
          const partnerId = remoteUser._id.toString();
          const match = list.find(s => {
            const pId = s.otherUser?._id?.toString() || s.fromUser?.toString() || s.toUser?.toString();
            return pId === partnerId;
          });
          if (match) {
            setActiveSwap(match);
            if (match.durationMinutes) {
              setTargetDuration(match.durationMinutes);
            }
            if (match.milestones && match.milestones.length > 0) {
              setMilestones(match.milestones.map((m, idx) => ({
                id: m._id || `m-${idx}`,
                title: m.title,
                completed: Boolean(m.completed)
              })));
            }
            if (match.sessionNotes) {
              setStudioContent(match.sessionNotes);
            }
          }
        })
        .catch(() => {});
    }
  }, [callStatus, remoteUser, currentUser]);

  // Sound chime synthesizer for halfway switch notification
  const playHalfwayChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  }, []);

  // Halfway Split Timer monitor
  const targetSeconds = (targetDuration || 30) * 60;
  const halfwaySeconds = Math.floor(targetSeconds / 2);

  useEffect(() => {
    if (callStatus === 'ongoing' && halfwaySeconds > 0) {
      if (callDuration >= halfwaySeconds && !hasPlayedHalfwayCueRef.current) {
        hasPlayedHalfwayCueRef.current = true;
        playHalfwayChime();
        toast('🔔 Halfway checkpoint reached! Time to swap teaching roles.', {
          icon: '🔄',
          duration: 6000,
        });
        setCurrentTeacher('partner');
      }
    }
  }, [callDuration, callStatus, halfwaySeconds, playHalfwayChime]);

  // Outgoing sync helper
  const broadcastSync = useCallback((payload) => {
    if (!socket || !remoteUser?._id) return;
    socket.emit('studio-sync', {
      to: remoteUser._id,
      ...payload,
      lastEditedBy: currentUser?.fullname?.firstname || 'Partner'
    });
  }, [socket, remoteUser, currentUser]);

  // Auto initial workspace sync on call start
  useEffect(() => {
    if (callStatus === 'ongoing' && remoteUser?._id) {
      setShowStudio(true);
      const timer = setTimeout(() => {
        broadcastSync({
          isOpen: true,
          content: studioContent,
          milestones: milestones,
          mode: studioMode,
          language: codeLanguage,
          currentPhase: currentTeacher,
          targetDuration: targetDuration
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [callStatus]);

  // Socket listener for real-time collaborative workspace sync
  useEffect(() => {
    if (!socket) return;

    const handleStudioSync = (data) => {
      // Synchronize open/closed state so both participants see the notepad
      if (data.isOpen !== undefined) {
        setShowStudio(Boolean(data.isOpen));
      }
      if (data.content !== undefined) {
        // Only update if not actively typing to preserve caret position
        if (!isLocalTypingRef.current) {
          setStudioContent(data.content);
        }
      }
      if (data.mode) setStudioMode(data.mode);
      if (data.language) setCodeLanguage(data.language);
      if (data.milestones) setMilestones(data.milestones);
      if (data.currentPhase) {
        // Invert partner's relative perspective: if partner says 'you', it means them!
        setCurrentTeacher(data.currentPhase === 'you' ? 'partner' : 'you');
      }
      if (data.targetDuration) setTargetDuration(data.targetDuration);
      if (data.lastEditedBy) setLastEditedBy(data.lastEditedBy);
    };

    const handleStudioTyping = (data) => {
      setPartnerIsTyping(Boolean(data.isTyping));
      if (data.isTyping) {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          setPartnerIsTyping(false);
        }, 2000);
      }
    };

    socket.on('studio-sync', handleStudioSync);
    socket.on('studio-typing', handleStudioTyping);

    return () => {
      socket.off('studio-sync', handleStudioSync);
      socket.off('studio-typing', handleStudioTyping);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [socket]);

  // Content edit with debounce & typing status
  const handleContentChange = (e) => {
    const val = e.target.value;
    isLocalTypingRef.current = true;
    setStudioContent(val);

    if (socket && remoteUser?._id) {
      socket.emit('studio-typing', {
        to: remoteUser._id,
        isTyping: true,
        user: currentUser?.fullname?.firstname
      });
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isLocalTypingRef.current = false;
      broadcastSync({ content: val, mode: studioMode, language: codeLanguage, isOpen: true });
      if (socket && remoteUser?._id) {
        socket.emit('studio-typing', { to: remoteUser._id, isTyping: false });
      }
    }, 200);
  };

  // Handle Tab key in code scratchpad
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const nextContent = studioContent.substring(0, start) + '  ' + studioContent.substring(end);
      setStudioContent(nextContent);
      broadcastSync({ content: nextContent, mode: studioMode, language: codeLanguage, isOpen: true });
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  // Toggle studio visibility with synchronization
  const handleToggleStudio = () => {
    const nextShow = !showStudio;
    setShowStudio(nextShow);
    broadcastSync({ isOpen: nextShow });
  };

  // Toggle mode (Notes vs Code)
  const handleModeChange = (mode) => {
    setStudioMode(mode);
    broadcastSync({ mode });
  };

  // Change code language
  const handleLanguageChange = (lang) => {
    setCodeLanguage(lang);
    broadcastSync({ language: lang });
  };

  // Quick insertion helpers for notes
  const insertText = (prefix, suffix = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = studioContent.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const nextContent = studioContent.substring(0, start) + replacement + studioContent.substring(end);
    setStudioContent(nextContent);
    broadcastSync({ content: nextContent, mode: studioMode, isOpen: true });
  };

  // Milestones handlers
  const handleToggleMilestone = (id) => {
    const updated = milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m);
    setMilestones(updated);
    broadcastSync({ milestones: updated });
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    const item = {
      id: `m-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      completed: false
    };
    const updated = [...milestones, item];
    setMilestones(updated);
    setNewMilestoneTitle('');
    broadcastSync({ milestones: updated });
  };

  const handleDeleteMilestone = (id) => {
    const updated = milestones.filter(m => m.id !== id);
    setMilestones(updated);
    broadcastSync({ milestones: updated });
  };

  // Swap teaching roles manually
  const handleToggleRole = () => {
    const nextRole = currentTeacher === 'you' ? 'partner' : 'you';
    setCurrentTeacher(nextRole);
    broadcastSync({ currentPhase: nextRole });
    toast.success(`Active teacher switched to ${nextRole === 'you' ? 'You' : partnerName}`, { icon: '🔄' });
  };

  // Change target duration
  const handleDurationSelect = (mins) => {
    setTargetDuration(mins);
    broadcastSync({ targetDuration: mins });
  };

  // Copy workspace to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(studioContent);
    toast.success('Workspace copied to clipboard', { icon: '📋' });
  };

  // Download workspace as file
  const handleDownload = () => {
    const ext = studioMode === 'code' ? (codeLanguage === 'python' ? 'py' : codeLanguage === 'html' ? 'html' : 'js') : 'md';
    const blob = new Blob([studioContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillswap-${studioMode}-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded session file (.${ext})`, { icon: '💾' });
  };

  // Save workspace to MongoDB
  const handleSaveWorkspace = async () => {
    if (!activeSwap?._id) {
      toast('Workspace synced live with partner via Socket.io', { icon: '⚡' });
      return;
    }
    setIsSavingWorkspace(true);
    try {
      await swapService.updateWorkspace({
        swapId: activeSwap._id,
        milestones: milestones.map(m => ({ title: m.title, completed: m.completed })),
        sessionNotes: studioContent
      });
      toast.success('Workspace saved to swap history!', { icon: '✅' });
    } catch (err) {
      toast.error('Failed to persist workspace to swap');
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  // Simple Markdown renderer
  const renderMarkdown = (text) => {
    if (!text?.trim()) {
      return <p className="text-[#A4B0C6] italic text-xs">Empty scratchpad. Begin taking notes...</p>;
    }
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs text-[#F7F8FC]">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return <h4 key={idx} className="font-bold text-[#FFEEA8] text-sm pt-2">{line.slice(4)}</h4>;
          }
          if (line.startsWith('## ')) {
            return <h3 key={idx} className="font-bold text-[#FFEEA8] text-base pt-3 border-b border-[rgba(255,255,255,0.08)] pb-1">{line.slice(3)}</h3>;
          }
          if (line.startsWith('# ')) {
            return <h2 key={idx} className="font-bold text-[#FFEEA8] text-lg pt-2">{line.slice(2)}</h2>;
          }
          if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
            return (
              <div key={idx} className="flex items-center gap-2 text-[#A4B0C6] line-through">
                <CheckSquare size={13} className="text-[#FFEEA8] shrink-0" />
                <span>{line.slice(6)}</span>
              </div>
            );
          }
          if (line.startsWith('- [ ] ')) {
            return (
              <div key={idx} className="flex items-center gap-2">
                <Square size={13} className="text-[#A4B0C6] shrink-0" />
                <span>{line.slice(6)}</span>
              </div>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-[#FFEEA8] font-bold">•</span>
                <span>{line.slice(2)}</span>
              </div>
            );
          }
          if (line.startsWith('```')) {
            return <div key={idx} className="text-[10px] font-mono text-[#FFEEA8]/80 py-0.5">{line}</div>;
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }
          return <p key={idx} className="leading-relaxed text-[#F7F8FC]/90">{line}</p>;
        })}
      </div>
    );
  };

  if (callStatus === 'idle') return null;

  const partnerName = `${remoteUser?.fullname?.firstname || 'Partner'} ${remoteUser?.fullname?.lastname || ''}`.trim();
  const avatarSeed = remoteUser?.fullname?.firstname || 'Partner';

  // Calculate split bar percentages
  const progressPercent = Math.min(100, Math.round((callDuration / Math.max(1, targetSeconds)) * 100));
  const isSecondHalf = callDuration >= halfwaySeconds;
  const currentPhaseSecondsRemaining = isSecondHalf 
    ? Math.max(0, targetSeconds - callDuration) 
    : Math.max(0, halfwaySeconds - callDuration);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
      
      {/* 1. Incoming Call Dialog */}
      {callStatus === 'incoming' && (
        <div className="z-[300] ui-card p-6 sm:p-8 rounded-3xl border border-[rgba(255,255,255,0.18)] shadow-2xl text-center max-w-sm w-full bg-[#283144] animate-in fade-in duration-200">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-[#FFEEA8] shadow-lg bg-[#171D2B] relative">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FFEEA8] rounded-full animate-ping" />
          </div>

          <span className="tag-chip text-[9px] mb-2 inline-flex items-center gap-1">
            <Radio size={10} className="text-[#FFEEA8] animate-pulse" />
            <span>INCOMING VIDEO CALL</span>
          </span>

          <h3 className="heading-h2 text-base sm:text-lg text-[#F7F8FC] mb-1">
            {partnerName}
          </h3>
          <p className="text-[#FFEEA8] text-xs font-mono font-semibold uppercase tracking-wider mb-6">
            {isAnswering ? 'Connecting audio & video...' : 'Incoming reciprocal exchange'}
          </p>
          
          <div className="flex justify-center items-center gap-6">
            <button 
              type="button"
              onClick={rejectCall}
              disabled={isAnswering}
              className="w-12 h-12 rounded-full bg-[#D72E2B] text-white flex items-center justify-center hover:bg-[#BE2421] active:translate-y-px transition-colors shadow-md font-bold cursor-pointer disabled:opacity-50"
              title="Decline"
            >
              <PhoneOff size={20} />
            </button>
            <button 
              type="button"
              onClick={acceptCall}
              disabled={isAnswering}
              className={`w-12 h-12 rounded-full bg-[#FFEEA8] text-[#202738] font-bold flex items-center justify-center hover:bg-[#FFDF80] active:translate-y-px transition-colors shadow-md cursor-pointer ${
                isAnswering ? 'opacity-80 cursor-wait' : 'animate-pulse'
              }`}
              title="Accept Call"
            >
              {isAnswering ? (
                <Loader2 size={20} className="animate-spin text-[#202738]" />
              ) : (
                <Phone size={20} />
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. Calling & Ongoing Call Workspace */}
      {(callStatus === 'calling' || callStatus === 'ongoing') && (
        <div 
          ref={containerRef}
          className={`z-[300] relative w-full h-full ${
            showStudio ? 'max-w-[1360px] max-h-[92vh]' : 'max-w-5xl max-h-[85vh]'
          } bg-[#121722] rounded-3xl overflow-hidden shadow-2xl border border-[rgba(255,255,255,0.15)] flex flex-col justify-between transition-all duration-300`}
        >
          {/* Top Call Status Bar */}
          <div className="p-3 px-4 sm:px-6 bg-[#171D2B]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between z-20 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                callStatus === 'ongoing' ? 'bg-[#FFEEA8] animate-pulse' : 'bg-[#FFA502]'
              }`} />
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#F7F8FC] uppercase tracking-wider block truncate">
                    {partnerName}
                  </span>
                  {isScreenSharing && (
                    <span className="bg-[#D72E2B]/20 text-[#D72E2B] border border-[#D72E2B]/40 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider uppercase">
                      Screen Sharing
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-[#A4B0C6] block">
                  {callStatus === 'ongoing' 
                    ? `Reciprocal Session • Leading: ${currentTeacher === 'you' ? 'You' : partnerName}` 
                    : 'Calling partner...'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {callStatus === 'ongoing' && (
                <div className="tag-chip text-[11px] font-mono font-bold bg-[#202738] text-[#FFEEA8] border border-[rgba(255,238,168,0.3)] px-2.5 py-1">
                  LIVE {formatDuration(callDuration)}
                </div>
              )}

              {/* Studio Toggle Button */}
              {callStatus === 'ongoing' && (
                <button
                  type="button"
                  onClick={handleToggleStudio}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    showStudio 
                      ? 'bg-[#FFEEA8] text-[#171D2B] shadow-md' 
                      : 'bg-[#202738] text-[#F7F8FC] hover:bg-[#283144] border border-[rgba(255,255,255,0.15)]'
                  }`}
                  title={showStudio ? "Minimize Collaborative Studio" : "Open Collaborative Studio"}
                >
                  {showStudio ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                  <span className="hidden sm:inline">Studio</span>
                  {partnerIsTyping && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D72E2B] animate-ping ml-0.5" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.16)] text-[#F7F8FC] cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button
                type="button"
                onClick={endCall}
                className="p-1.5 rounded-lg bg-[#D72E2B]/20 hover:bg-[#D72E2B] text-[#D72E2B] hover:text-[#202738] transition-colors cursor-pointer"
                title="End Call"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Central Workspace Area (Split when Studio is active) */}
          <div className="relative flex-grow flex flex-col lg:flex-row overflow-hidden bg-[#0E131C]">
            
            {/* Video Viewport Column */}
            <div className={`relative flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${
              showStudio ? 'w-full lg:w-[52%] h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-[rgba(255,255,255,0.1)]' : 'w-full h-full'
            }`}>
              
              {/* Remote Video is ALWAYS mounted to prevent React ref nullification */}
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className={`w-full h-full object-contain bg-black ${remoteStream ? 'block' : 'hidden'}`}
              />

              {!remoteStream && (
                <div className="flex flex-col items-center justify-center text-[#F7F8FC] gap-4 p-8 text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-[#171D2B] flex items-center justify-center border border-[rgba(255,255,255,0.15)] shadow-xl relative">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                      alt=""
                      className="w-full h-full object-cover opacity-85"
                    />
                    {callStatus === 'calling' && (
                      <div className="absolute inset-0 border-2 border-[#FFEEA8] animate-ping pointer-events-none" />
                    )}
                  </div>
                  <div>
                    <h3 className="heading-h2 text-base sm:text-lg text-[#F7F8FC] mb-1">
                      {callStatus === 'calling' ? `Calling ${partnerName}...` : `Connecting with ${partnerName}...`}
                    </h3>
                    <p className="text-[#A4B0C6] text-xs font-mono tracking-wider uppercase">
                      {callStatus === 'calling' ? 'Waiting for answer...' : 'Connecting WebRTC stream...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Local Video Picture-in-Picture (PiP) */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-28 sm:w-44 aspect-video bg-[#171D2B] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.25)] shadow-2xl z-10">
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className={`w-full h-full object-cover scale-x-[-1] ${isVideoDisabled ? 'hidden' : 'block'}`}
                />
                {isVideoDisabled && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#A4B0C6] text-[10px] font-mono bg-[#202738] gap-1 p-1 text-center">
                    <VideoOff size={13} className="text-[#D72E2B]" />
                    <span>Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1.5 font-mono text-[8px] bg-black/80 px-1 py-0.5 rounded text-white/90">
                  YOU {isMuted && '• MUTED'} {isScreenSharing && '• SCREEN'}
                </div>
              </div>

              {/* In-Call Quick Split Status Badge (Bottom-left of video) */}
              {callStatus === 'ongoing' && (
                <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-10 flex items-center gap-2 bg-[#171D2B]/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-[rgba(255,255,255,0.15)] shadow-md">
                  <span className={`w-2 h-2 rounded-full ${currentTeacher === 'you' ? 'bg-[#FFEEA8]' : 'bg-[#D72E2B]'} animate-pulse`} />
                  <span className="font-mono text-[10px] text-[#F7F8FC] font-semibold">
                    {currentTeacher === 'you' ? 'Leading: You' : `Leading: ${partnerName}`}
                  </span>
                  <span className="text-[9px] font-mono text-[#A4B0C6]">
                    ({formatDuration(currentPhaseSecondsRemaining)} left in half)
                  </span>
                </div>
              )}

              {/* If studio is collapsed, show floating button to re-open */}
              {!showStudio && callStatus === 'ongoing' && (
                <button
                  type="button"
                  onClick={handleToggleStudio}
                  className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex items-center gap-1.5 bg-[#FFEEA8] text-[#171D2B] font-mono font-bold text-xs px-3 py-1.5 rounded-xl shadow-lg hover:bg-[#FFDF80] cursor-pointer transition-all animate-in fade-in"
                >
                  <BookOpen size={14} />
                  <span>Open Studio</span>
                </button>
              )}
            </div>

            {/* Stage 2 Collaborative Studio Column */}
            {showStudio && (
              <div className="w-full lg:w-[48%] h-1/2 lg:h-full flex flex-col bg-[#141A26] overflow-hidden animate-in fade-in duration-200">
                
                {/* Studio Header: Tabs & Quick Actions */}
                <div className="p-2 sm:p-3 bg-[#171D2B] border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-[#202738] p-1 rounded-xl border border-[rgba(255,255,255,0.08)]">
                    <button
                      type="button"
                      onClick={() => setStudioTab('scratchpad')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        studioTab === 'scratchpad' 
                          ? 'bg-[#FFEEA8] text-[#171D2B] shadow-sm' 
                          : 'text-[#A4B0C6] hover:text-[#F7F8FC]'
                      }`}
                    >
                      <Edit3 size={13} />
                      <span>Scratchpad</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudioTab('agenda')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        studioTab === 'agenda' 
                          ? 'bg-[#FFEEA8] text-[#171D2B] shadow-sm' 
                          : 'text-[#A4B0C6] hover:text-[#F7F8FC]'
                      }`}
                    >
                      <Clock size={13} />
                      <span>Split Agenda</span>
                    </button>
                  </div>

                  {/* Actions for Scratchpad */}
                  <div className="flex items-center gap-1.5">
                    {partnerIsTyping && (
                      <span className="text-[10px] font-mono text-[#FFEEA8] animate-pulse flex items-center gap-1 mr-1">
                        <Sparkles size={11} /> {partnerName} typing...
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg bg-[#202738] hover:bg-[#283144] text-[#A4B0C6] hover:text-[#F7F8FC] border border-[rgba(255,255,255,0.08)] cursor-pointer"
                      title="Copy Content"
                    >
                      <Copy size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="p-1.5 rounded-lg bg-[#202738] hover:bg-[#283144] text-[#A4B0C6] hover:text-[#F7F8FC] border border-[rgba(255,255,255,0.08)] cursor-pointer"
                      title="Download Workspace"
                    >
                      <Download size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveWorkspace}
                      disabled={isSavingWorkspace}
                      className="px-2.5 py-1 rounded-lg bg-[#2B3F74] hover:bg-[#384E8D] text-white text-xs font-mono font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Save to SkillSwap History"
                    >
                      <Save size={13} />
                      <span className="hidden sm:inline">Save</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleStudio}
                      className="p-1.5 rounded-lg bg-[#202738] hover:bg-[#283144] text-[#A4B0C6] hover:text-[#F7F8FC] border border-[rgba(255,255,255,0.08)] cursor-pointer ml-1"
                      title="Minimize Studio"
                    >
                      <PanelRightClose size={13} />
                    </button>
                  </div>
                </div>

                {/* Studio Tab 1: Scratchpad & Live Code Editor */}
                {studioTab === 'scratchpad' && (
                  <div className="flex-1 flex flex-col min-h-0 bg-[#0E131C]">
                    {/* Scratchpad Subheader */}
                    <div className="px-3 py-1.5 bg-[#171D2B]/70 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleModeChange('notes')}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                            studioMode === 'notes' ? 'bg-[#202738] text-[#FFEEA8] border border-[rgba(255,238,168,0.3)]' : 'text-[#A4B0C6]'
                          }`}
                        >
                          Markdown Notes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModeChange('code')}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                            studioMode === 'code' ? 'bg-[#202738] text-[#FFEEA8] border border-[rgba(255,238,168,0.3)]' : 'text-[#A4B0C6]'
                          }`}
                        >
                          Code Scratchpad
                        </button>
                      </div>

                      {studioMode === 'code' ? (
                        <select
                          value={codeLanguage}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="bg-[#202738] text-[#FFEEA8] text-[11px] font-mono rounded px-2 py-0.5 border border-[rgba(255,255,255,0.1)] outline-none"
                        >
                          <option value="javascript">JavaScript / TS</option>
                          <option value="python">Python</option>
                          <option value="html">HTML / CSS</option>
                          <option value="sql">SQL</option>
                          <option value="plaintext">Plain Text</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => insertText('**', '**')}
                            className="px-1.5 py-0.5 font-bold text-[11px] hover:bg-[#202738] text-[#A4B0C6] rounded cursor-pointer"
                            title="Bold"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() => insertText('`', '`')}
                            className="px-1.5 py-0.5 font-mono text-[11px] hover:bg-[#202738] text-[#A4B0C6] rounded cursor-pointer"
                            title="Inline Code"
                          >
                            {'{ }'}
                          </button>
                          <button
                            type="button"
                            onClick={() => insertText('\n- [ ] ')}
                            className="px-1.5 py-0.5 text-[11px] hover:bg-[#202738] text-[#A4B0C6] rounded cursor-pointer"
                            title="Insert Checklist Item"
                          >
                            ☑
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPreview(prev => !prev)}
                            className={`p-1 rounded text-[11px] cursor-pointer ml-1 ${
                              showPreview ? 'bg-[#FFEEA8] text-[#171D2B]' : 'hover:bg-[#202738] text-[#A4B0C6]'
                            }`}
                            title="Toggle Markdown Preview"
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Editor / Live Preview Body */}
                    <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-[#F7F8FC]">
                      {showPreview && studioMode === 'notes' ? (
                        <div className="p-2 bg-[#121722] rounded-xl border border-[rgba(255,255,255,0.08)] min-h-full">
                          {renderMarkdown(studioContent)}
                        </div>
                      ) : (
                        <textarea
                          ref={textareaRef}
                          value={studioContent}
                          onChange={handleContentChange}
                          onKeyDown={handleKeyDown}
                          placeholder={studioMode === 'code' ? '// Write or paste shared code here...\nfunction pairCoding() {\n  return "SkillSwap Studio";\n}' : '# Session Notes\n- Add key topics covered...\n- List next goals'}
                          className="w-full h-full bg-transparent resize-none outline-none border-none leading-relaxed text-[#F7F8FC] placeholder:text-[#A4B0C6]/40 font-mono text-xs sm:text-sm"
                          spellCheck="false"
                        />
                      )}
                    </div>

                    {/* Editor Footer Status */}
                    <div className="px-3 py-1 bg-[#171D2B] border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-[10px] font-mono text-[#A4B0C6]">
                      <span>{studioContent.length} chars • {studioContent.split('\n').length} lines</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFEEA8] animate-pulse" />
                        Synchronized Studio Active
                      </span>
                    </div>
                  </div>
                )}

                {/* Studio Tab 2: Split Agenda & Milestones */}
                {studioTab === 'agenda' && (
                  <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-y-auto space-y-4 bg-[#0E131C]">
                    
                    {/* Bilateral Split Session Timer Card */}
                    <div className="p-3.5 bg-[#171D2B] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-md space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock size={15} className="text-[#FFEEA8]" />
                          <h4 className="font-mono text-xs font-bold text-[#F7F8FC] uppercase tracking-wider">
                            Split Session Timer
                          </h4>
                        </div>
                        {/* Target duration selector */}
                        <div className="flex items-center gap-1 bg-[#202738] p-0.5 rounded-lg border border-[rgba(255,255,255,0.1)] text-[10px] font-mono">
                          {[30, 45, 60].map(mins => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => handleDurationSelect(mins)}
                              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                                targetDuration === mins ? 'bg-[#FFEEA8] text-[#171D2B] font-bold' : 'text-[#A4B0C6]'
                              }`}
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Visual Two-Tone Split Progress Bar */}
                      <div>
                        <div className="relative w-full h-3 bg-[#202738] rounded-full overflow-hidden border border-[rgba(255,255,255,0.08)]">
                          {/* Halfway Divider Pin */}
                          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 z-10" title="50% Swap Point" />
                          
                          {/* Progress Fill */}
                          <div 
                            className={`h-full transition-all duration-300 ${
                              isSecondHalf ? 'bg-[#D72E2B]' : 'bg-[#FFEEA8]'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-mono text-[#A4B0C6] mt-1.5">
                          <span className={currentTeacher === 'you' ? 'text-[#FFEEA8] font-bold' : ''}>
                            Part 1: You Teach ({Math.round(targetDuration / 2)}m)
                          </span>
                          <span className="text-[9px] text-white/50">50% Swap</span>
                          <span className={currentTeacher === 'partner' ? 'text-[#D72E2B] font-bold' : ''}>
                            Part 2: {partnerName} Teaches ({Math.round(targetDuration / 2)}m)
                          </span>
                        </div>
                      </div>

                      {/* Active Role Control & Swap Button */}
                      <div className="flex items-center justify-between p-2.5 bg-[#202738] rounded-xl border border-[rgba(255,255,255,0.08)]">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            currentTeacher === 'you' ? 'bg-[#FFEEA8]' : 'bg-[#D72E2B]'
                          } animate-pulse`} />
                          <div className="text-xs font-mono">
                            <span className="text-[#A4B0C6] block text-[9px] uppercase">Currently Leading:</span>
                            <span className="text-[#F7F8FC] font-bold">
                              {currentTeacher === 'you' ? 'You' : partnerName}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleToggleRole}
                          className="px-3 py-1.5 rounded-xl bg-[#FFEEA8] hover:bg-[#FFDF80] text-[#171D2B] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                        >
                          <ArrowRightLeft size={13} />
                          <span>Swap Roles</span>
                        </button>
                      </div>
                    </div>

                    {/* Real-time Learning Milestones Checklist */}
                    <div className="p-3.5 bg-[#171D2B] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-md space-y-3 flex-1 flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-[#FFEEA8]" />
                          <h4 className="font-mono text-xs font-bold text-[#F7F8FC] uppercase tracking-wider">
                            Session Milestones
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-[#FFEEA8] bg-[#202738] px-2 py-0.5 rounded-full border border-[rgba(255,255,255,0.08)]">
                          {milestones.filter(m => m.completed).length} / {milestones.length} Done
                        </span>
                      </div>

                      {/* Milestones List */}
                      <div className="space-y-2 flex-1 overflow-y-auto max-h-52">
                        {milestones.map((m) => (
                          <div 
                            key={m.id}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                              m.completed 
                                ? 'bg-[#202738]/40 border-[rgba(255,255,255,0.05)] text-[#A4B0C6]' 
                                : 'bg-[#202738] border-[rgba(255,255,255,0.1)] text-[#F7F8FC]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleMilestone(m.id)}
                              className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                            >
                              {m.completed ? (
                                <CheckSquare size={15} className="text-[#FFEEA8] shrink-0" />
                              ) : (
                                <Square size={15} className="text-[#A4B0C6] shrink-0" />
                              )}
                              <span className={`text-xs truncate ${m.completed ? 'line-through text-[#A4B0C6]' : 'font-medium'}`}>
                                {m.title}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteMilestone(m.id)}
                              className="p-1 text-[#A4B0C6] hover:text-[#D72E2B] transition-colors cursor-pointer shrink-0 ml-1"
                              title="Delete Milestone"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Milestone Input Form */}
                      <form onSubmit={handleAddMilestone} className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          value={newMilestoneTitle}
                          onChange={(e) => setNewMilestoneTitle(e.target.value)}
                          placeholder="Add new milestone goal..."
                          className="flex-1 bg-[#202738] border border-[rgba(255,255,255,0.1)] rounded-xl px-2.5 py-1.5 text-xs text-[#F7F8FC] placeholder:text-[#A4B0C6]/50 outline-none focus:border-[#FFEEA8]"
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1.5 bg-[#FFEEA8] text-[#171D2B] rounded-xl font-bold text-xs flex items-center justify-center hover:bg-[#FFDF80] transition-colors cursor-pointer shrink-0"
                          title="Add Goal"
                        >
                          <Plus size={14} />
                        </button>
                      </form>
                    </div>

                  </div>
                )}

              </div>
            )}
          </div>

          {/* Bottom Action Controls Bar */}
          <div className="p-2.5 sm:p-3.5 bg-[#171D2B]/95 backdrop-blur-md border-t border-[rgba(255,255,255,0.1)] flex items-center justify-center gap-2 sm:gap-4 z-20 flex-wrap">
            {/* Mic Toggle */}
            <button 
              type="button"
              onClick={toggleMic}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isMuted 
                  ? 'bg-[#D72E2B] text-white shadow-md font-bold' 
                  : 'bg-[#202738] border border-[rgba(255,255,255,0.15)] hover:bg-[#283144] text-[#F7F8FC]'
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {/* Camera Toggle */}
            <button 
              type="button"
              onClick={toggleVideo}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isVideoDisabled 
                  ? 'bg-[#D72E2B] text-white shadow-md font-bold' 
                  : 'bg-[#202738] border border-[rgba(255,255,255,0.15)] hover:bg-[#283144] text-[#F7F8FC]'
              }`}
              title={isVideoDisabled ? "Enable Camera" : "Disable Camera"}
            >
              {isVideoDisabled ? <VideoOff size={16} /> : <Video size={16} />}
            </button>

            {/* Screen Share Toggle */}
            <button 
              type="button"
              onClick={toggleScreenShare}
              disabled={callStatus !== 'ongoing'}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${
                isScreenSharing 
                  ? 'bg-[#FFEEA8] text-[#171D2B] shadow-md font-bold' 
                  : 'bg-[#202738] border border-[rgba(255,255,255,0.15)] hover:bg-[#283144] text-[#F7F8FC]'
              }`}
              title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
            >
              {isScreenSharing ? <MonitorOff size={16} /> : <MonitorUp size={16} />}
            </button>

            {/* Studio Toggle (Bottom Bar for Quick Access) */}
            <button 
              type="button"
              onClick={handleToggleStudio}
              disabled={callStatus !== 'ongoing'}
              className={`h-10 sm:h-11 px-3 sm:px-4 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 font-mono text-xs font-bold ${
                showStudio 
                  ? 'bg-[#FFEEA8] text-[#171D2B] shadow-md' 
                  : 'bg-[#202738] border border-[rgba(255,255,255,0.15)] hover:bg-[#283144] text-[#F7F8FC]'
              }`}
              title="Open Collaborative Studio"
            >
              <BookOpen size={16} />
              <span>Studio</span>
            </button>

            {/* End / Hang Up Button */}
            <button 
              type="button"
              onClick={endCall}
              className="h-10 sm:h-11 px-3 sm:px-6 rounded-full bg-[#D72E2B] hover:bg-[#BE2421] text-white flex items-center gap-1.5 sm:gap-2 font-bold transition-colors shadow-md cursor-pointer ml-1 sm:ml-2 shrink-0"
              title="Terminate Call"
            >
              <PhoneOff size={16} />
              <span className="text-[11px] sm:text-xs uppercase tracking-wider font-mono">
                {callStatus === 'calling' ? 'Cancel' : 'Hang Up'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallModal;
