import React, { useEffect, useRef, useState } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  X
} from 'lucide-react';
import { useVideoCall } from '../context/VideoCallContext';

const VideoCallModal = () => {
  const { 
    callStatus, 
    remoteUser, 
    localStream, 
    remoteStream, 
    acceptCall, 
    rejectCall, 
    endCall 
  } = useVideoCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);

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

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoDisabled(prev => !prev);
    }
  };

  if (callStatus === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      
      {/* Incoming Call UI: z-index modal (300) per DESIGN.md */}
      {callStatus === 'incoming' && (
        <div className="z-[300] ui-card p-8 rounded-none border border-[rgba(255,255,255,0.15)] shadow-2xl text-center max-w-sm w-full bg-[#353B48]">
          <div className="w-20 h-20 rounded-none overflow-hidden mx-auto mb-4 border-2 border-[rgba(255,255,255,0.2)] shadow-lg bg-[#242A32]">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${remoteUser?.fullname?.firstname || 'Partner'}`}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <span className="tag-chip text-[9px] mb-2 inline-block">INCOMING EXCHANGE</span>
          <h3 className="heading-h2 text-lg text-[#F5F6FA] mb-1">
            {remoteUser?.fullname?.firstname} {remoteUser?.fullname?.lastname}
          </h3>
          <p className="text-[#55E6C1] text-xs font-mono font-semibold uppercase tracking-wider mb-8">
            Video Sync Requested...
          </p>
          
          <div className="flex justify-center items-center gap-6">
            <button 
              onClick={rejectCall}
              className="w-12 h-12 rounded-none bg-[#FF7675] text-[#2F3640] flex items-center justify-center hover:bg-[#e05a59] active:translate-y-px transition-colors shadow-md font-bold"
              title="Decline"
            >
              <PhoneOff size={20} />
            </button>
            <button 
              onClick={acceptCall}
              className="w-12 h-12 rounded-none bg-[#55E6C1] text-[#2F3640] font-bold flex items-center justify-center hover:bg-[#45d4af] active:translate-y-px transition-colors shadow-md"
              title="Accept"
            >
              <Phone size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Calling / Ongoing UI */}
      {(callStatus === 'calling' || callStatus === 'ongoing') && (
        <div className="z-[300] relative w-full h-full max-w-5xl max-h-[82vh] bg-[#242A32] rounded-none overflow-hidden shadow-2xl border border-[rgba(255,255,255,0.15)] flex flex-col justify-between">
          
          {/* Top Info Bar */}
          <div className="p-4 px-6 bg-[#1E232A]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-none bg-[#55E6C1]" />
              <span className="font-mono text-xs font-semibold text-[#F5F6FA] uppercase tracking-wider">
                Bilateral Sync // {remoteUser?.fullname?.firstname || 'PEER'}
              </span>
            </div>
            <button
              onClick={endCall}
              className="p-1.5 rounded-none bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-[#F5F6FA]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Remote Video (Full Screen View) */}
          <div className="relative flex-grow bg-[#1E232A] flex items-center justify-center overflow-hidden">
            {remoteStream ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-[#F5F6FA] gap-4 p-8 text-center">
                <div className="w-20 h-20 rounded-none overflow-hidden bg-[#2F3640] flex items-center justify-center border border-[rgba(255,255,255,0.2)]">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${remoteUser?.fullname?.firstname || 'User'}`}
                    alt=""
                    className="w-full h-full object-cover opacity-80"
                  />
                </div>
                <div>
                  <h3 className="heading-h2 text-lg text-[#F5F6FA] mb-1">Connecting to {remoteUser?.fullname?.firstname}...</h3>
                  <p className="text-[#A4B0BE] text-xs font-mono tracking-wider uppercase">Negotiating ICE candidates</p>
                </div>
              </div>
            )}

            {/* Local Video (PiP) */}
            <div className="absolute top-4 right-4 w-40 sm:w-56 aspect-video bg-[#242A32] rounded-none overflow-hidden border border-[rgba(255,255,255,0.2)] shadow-2xl z-10">
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover ${isVideoDisabled ? 'hidden' : 'block'}`}
              />
              {isVideoDisabled && (
                <div className="w-full h-full flex items-center justify-center text-[#A4B0BE] text-xs font-semibold bg-[#2F3640]">
                  Camera muted
                </div>
              )}
            </div>
          </div>

          {/* Bottom Controls Bar */}
          <div className="p-4 bg-[#1E232A]/90 backdrop-blur-md border-t border-[rgba(255,255,255,0.1)] flex items-center justify-center gap-4 z-20">
            <button 
              onClick={toggleMic}
              className={`w-11 h-11 rounded-none flex items-center justify-center transition-colors ${
                isMuted 
                  ? 'bg-[#FF7675] text-[#2F3640] shadow-md' 
                  : 'bg-[#2F3640] border border-[rgba(255,255,255,0.15)] hover:bg-[#353B48] text-[#F5F6FA]'
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button 
              onClick={toggleVideo}
              className={`w-11 h-11 rounded-none flex items-center justify-center transition-colors ${
                isVideoDisabled 
                  ? 'bg-[#FF7675] text-[#2F3640] shadow-md' 
                  : 'bg-[#2F3640] border border-[rgba(255,255,255,0.15)] hover:bg-[#353B48] text-[#F5F6FA]'
              }`}
              title={isVideoDisabled ? "Turn Video On" : "Turn Video Off"}
            >
              {isVideoDisabled ? <VideoOff size={18} /> : <Video size={18} />}
            </button>

            <button 
              onClick={endCall}
              className="w-12 h-11 rounded-none bg-[#FF7675] hover:bg-[#e05a59] text-[#2F3640] flex items-center justify-center font-bold transition-colors shadow-md"
              title="Terminate Call"
            >
              <PhoneOff size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallModal;
