import React, { useEffect, useRef, useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { useVideoCall } from '../context/VideoCallContext';

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
    acceptCall, 
    rejectCall, 
    endCall,
    toggleMic,
    toggleVideo,
    toggleScreenShare
  } = useVideoCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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

  if (callStatus === 'idle') return null;

  const partnerName = `${remoteUser?.fullname?.firstname || 'Partner'} ${remoteUser?.fullname?.lastname || ''}`.trim();
  const avatarSeed = remoteUser?.fullname?.firstname || 'Partner';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6">
      
      {/* 1. Incoming Call Dialog (z-[300]) */}
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
            Incoming video call
          </p>
          
          <div className="flex justify-center items-center gap-6">
            <button 
              type="button"
              onClick={rejectCall}
              className="w-12 h-12 rounded-full bg-[#D72E2B] text-white flex items-center justify-center hover:bg-[#BE2421] active:translate-y-px transition-colors shadow-md font-bold cursor-pointer"
              title="Decline"
            >
              <PhoneOff size={20} />
            </button>
            <button 
              type="button"
              onClick={acceptCall}
              className="w-12 h-12 rounded-full bg-[#FFEEA8] text-[#202738] font-bold flex items-center justify-center hover:bg-[#FFEEA8] active:translate-y-px transition-colors shadow-md cursor-pointer animate-pulse"
              title="Accept Call"
            >
              <Phone size={20} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Calling & Ongoing Call Workspace */}
      {(callStatus === 'calling' || callStatus === 'ongoing') && (
        <div 
          ref={containerRef}
          className="z-[300] relative w-full h-full max-w-5xl max-h-[85vh] bg-[#121722] rounded-3xl overflow-hidden shadow-2xl border border-[rgba(255,255,255,0.15)] flex flex-col justify-between"
        >
          {/* Top Call Status Bar */}
          <div className="p-3.5 px-5 bg-[#171D2B]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between z-20">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                callStatus === 'ongoing' ? 'bg-[#FFEEA8] animate-pulse' : 'bg-[#FFA502]'
              }`} />
              <div className="truncate">
                <span className="font-mono text-xs font-bold text-[#F7F8FC] uppercase tracking-wider block truncate">
                  Video Call &bull; {partnerName}
                </span>
                <span className="text-[10px] font-mono text-[#A4B0C6] block">
                  {callStatus === 'ongoing' ? 'Connected' : 'Calling...'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {callStatus === 'ongoing' && (
                <div className="tag-chip text-[11px] font-mono font-bold bg-[#202738] text-[#FFEEA8] border border-[rgba(255, 238, 168,0.3)]">
                  LIVE {formatDuration(callDuration)}
                </div>
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

          {/* Central Video Viewport */}
          <div className="relative flex-grow bg-[#0E131C] flex items-center justify-center overflow-hidden">
            {remoteStream ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain bg-black"
              />
            ) : (
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
                    {callStatus === 'calling' ? 'Waiting for answer...' : 'Connecting...'}
                  </p>
                </div>
              </div>
            )}

            {/* Local Video Picture-in-Picture (PiP) */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-28 sm:w-56 aspect-video bg-[#171D2B] rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.25)] shadow-2xl z-10">
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover scale-x-[-1] ${isVideoDisabled ? 'hidden' : 'block'}`}
              />
              {isVideoDisabled && (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#A4B0C6] text-[10px] sm:text-[11px] font-mono bg-[#202738] gap-1 p-1 sm:p-2 text-center">
                  <VideoOff size={14} className="text-[#D72E2B]" />
                  <span>Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-1.5 left-2 font-mono text-[8px] sm:text-[9px] bg-black/75 px-1.5 py-0.5 rounded-md text-white/90">
                YOU {isMuted && '(MUTED)'} {isScreenSharing && '(SCREEN)'}
              </div>
            </div>
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
