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
        <div className="z-[300] ui-card p-6 sm:p-8 rounded-none border border-[rgba(255,255,255,0.18)] shadow-2xl text-center max-w-sm w-full bg-[#353B48] animate-in fade-in duration-200">
          <div className="w-20 h-20 rounded-none overflow-hidden mx-auto mb-4 border-2 border-[#55E6C1] shadow-lg bg-[#242A32] relative">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#55E6C1] rounded-none animate-ping" />
          </div>

          <span className="tag-chip text-[9px] mb-2 inline-flex items-center gap-1">
            <Radio size={10} className="text-[#55E6C1] animate-pulse" />
            <span>INCOMING BILATERAL SYNC</span>
          </span>

          <h3 className="heading-h2 text-base sm:text-lg text-[#F5F6FA] mb-1">
            {partnerName}
          </h3>
          <p className="text-[#55E6C1] text-xs font-mono font-semibold uppercase tracking-wider mb-6">
            P2P Video Session Requested
          </p>
          
          <div className="flex justify-center items-center gap-6">
            <button 
              type="button"
              onClick={rejectCall}
              className="w-12 h-12 rounded-none bg-[#FF7675] text-[#2F3640] flex items-center justify-center hover:bg-[#e05a59] active:translate-y-px transition-colors shadow-md font-bold cursor-pointer"
              title="Decline"
            >
              <PhoneOff size={20} />
            </button>
            <button 
              type="button"
              onClick={acceptCall}
              className="w-12 h-12 rounded-none bg-[#55E6C1] text-[#2F3640] font-bold flex items-center justify-center hover:bg-[#45d4af] active:translate-y-px transition-colors shadow-md cursor-pointer animate-pulse"
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
          className="z-[300] relative w-full h-full max-w-5xl max-h-[85vh] bg-[#1E232A] rounded-none overflow-hidden shadow-2xl border border-[rgba(255,255,255,0.15)] flex flex-col justify-between"
        >
          {/* Top Status & Telemetry Bar */}
          <div className="p-3.5 px-5 bg-[#242A32]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between z-20">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-none shrink-0 ${
                callStatus === 'ongoing' ? 'bg-[#55E6C1] animate-pulse' : 'bg-[#FFA502]'
              }`} />
              <div className="truncate">
                <span className="font-mono text-xs font-bold text-[#F5F6FA] uppercase tracking-wider block truncate">
                  Bilateral Sync // {partnerName}
                </span>
                <span className="text-[10px] font-mono text-[#A4B0BE] block">
                  {callStatus === 'ongoing' ? 'WebRTC Encrypted &bull; 720p Peer Link' : 'Ringing &bull; Awaiting Answer'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {callStatus === 'ongoing' && (
                <div className="tag-chip text-[11px] font-mono font-bold bg-[#2B313A] text-[#55E6C1] border border-[rgba(85,230,193,0.3)]">
                  LIVE {formatDuration(callDuration)}
                </div>
              )}

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-none bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.16)] text-[#F5F6FA] cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button
                type="button"
                onClick={endCall}
                className="p-1.5 rounded-none bg-[#FF7675]/20 hover:bg-[#FF7675] text-[#FF7675] hover:text-[#2F3640] transition-colors cursor-pointer"
                title="End Call"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Central Video Viewport */}
          <div className="relative flex-grow bg-[#15191E] flex items-center justify-center overflow-hidden">
            {remoteStream ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-[#F5F6FA] gap-4 p-8 text-center">
                <div className="w-24 h-24 rounded-none overflow-hidden bg-[#242A32] flex items-center justify-center border border-[rgba(255,255,255,0.15)] shadow-xl relative">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                    alt=""
                    className="w-full h-full object-cover opacity-85"
                  />
                  {callStatus === 'calling' && (
                    <div className="absolute inset-0 border-2 border-[#55E6C1] animate-ping pointer-events-none" />
                  )}
                </div>
                <div>
                  <h3 className="heading-h2 text-base sm:text-lg text-[#F5F6FA] mb-1">
                    {callStatus === 'calling' ? `Calling ${partnerName}...` : `Connecting with ${partnerName}...`}
                  </h3>
                  <p className="text-[#A4B0BE] text-xs font-mono tracking-wider uppercase">
                    {callStatus === 'calling' ? 'Waiting for remote response' : 'Exchanging ICE descriptors'}
                  </p>
                </div>
              </div>
            )}

            {/* Local Video Picture-in-Picture (PiP) */}
            <div className="absolute top-4 right-4 w-36 sm:w-56 aspect-video bg-[#242A32] rounded-none overflow-hidden border border-[rgba(255,255,255,0.25)] shadow-2xl z-10">
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover scale-x-[-1] ${isVideoDisabled ? 'hidden' : 'block'}`}
              />
              {isVideoDisabled && (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#A4B0BE] text-[11px] font-mono bg-[#2B313A] gap-1 p-2 text-center">
                  <VideoOff size={16} className="text-[#FF7675]" />
                  <span>Camera Muted</span>
                </div>
              )}
              <div className="absolute bottom-1 left-1.5 font-mono text-[9px] bg-black/70 px-1 py-0.5 text-white/80">
                YOU {isMuted && '(MUTED)'} {isScreenSharing && '(SCREEN)'}
              </div>
            </div>
          </div>

          {/* Bottom Action Controls Bar */}
          <div className="p-3.5 bg-[#242A32]/95 backdrop-blur-md border-t border-[rgba(255,255,255,0.1)] flex items-center justify-center gap-3 sm:gap-5 z-20 flex-wrap">
            {/* Mic Toggle */}
            <button 
              type="button"
              onClick={toggleMic}
              className={`w-11 h-11 rounded-none flex items-center justify-center transition-colors cursor-pointer ${
                isMuted 
                  ? 'bg-[#FF7675] text-[#2F3640] shadow-md font-bold' 
                  : 'bg-[#2F3640] border border-[rgba(255,255,255,0.15)] hover:bg-[#353B48] text-[#F5F6FA]'
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Camera Toggle */}
            <button 
              type="button"
              onClick={toggleVideo}
              className={`w-11 h-11 rounded-none flex items-center justify-center transition-colors cursor-pointer ${
                isVideoDisabled 
                  ? 'bg-[#FF7675] text-[#2F3640] shadow-md font-bold' 
                  : 'bg-[#2F3640] border border-[rgba(255,255,255,0.15)] hover:bg-[#353B48] text-[#F5F6FA]'
              }`}
              title={isVideoDisabled ? "Enable Camera" : "Disable Camera"}
            >
              {isVideoDisabled ? <VideoOff size={18} /> : <Video size={18} />}
            </button>

            {/* Screen Share Toggle */}
            <button 
              type="button"
              onClick={toggleScreenShare}
              disabled={callStatus !== 'ongoing'}
              className={`w-11 h-11 rounded-none flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isScreenSharing 
                  ? 'bg-[#55E6C1] text-[#2F3640] shadow-md font-bold' 
                  : 'bg-[#2F3640] border border-[rgba(255,255,255,0.15)] hover:bg-[#353B48] text-[#F5F6FA]'
              }`}
              title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
            >
              {isScreenSharing ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
            </button>

            {/* End / Hang Up Button */}
            <button 
              type="button"
              onClick={endCall}
              className="h-11 px-6 rounded-none bg-[#FF7675] hover:bg-[#e05a59] text-[#2F3640] flex items-center gap-2 font-bold transition-colors shadow-md cursor-pointer ml-2"
              title="Terminate Call"
            >
              <PhoneOff size={18} />
              <span className="text-xs uppercase tracking-wider font-mono">
                {callStatus === 'calling' ? 'Cancel Call' : 'Hang Up'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallModal;
