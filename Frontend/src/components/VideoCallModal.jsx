import React, { useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Maximize2, 
  Minimize2,
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

  if (callStatus === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Incoming Call UI */}
      {callStatus === 'incoming' && (
        <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/20 shadow-2xl text-center max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300">
          <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 ring-4 ring-primary ring-offset-4 ring-offset-black/50">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${remoteUser?.fullname?.firstname}`} alt="" className="w-full h-full object-cover" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">{remoteUser?.fullname?.firstname} {remoteUser?.fullname?.lastname}</h3>
          <p className="text-white/60 mb-10 animate-pulse font-medium tracking-wide">INCOMING VIDEO CALL...</p>
          
          <div className="flex justify-center gap-8">
            <button 
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-error flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg shadow-error/40"
            >
              <PhoneOff size={28} />
            </button>
            <button 
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-success flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg shadow-success/40"
            >
              <Phone size={28} />
            </button>
          </div>
        </div>
      )}

      {/* Calling/Ongoing UI */}
      {(callStatus === 'calling' || callStatus === 'ongoing') && (
        <div className="relative w-full h-full max-w-6xl max-h-[85vh] mx-4 bg-surface-container-highest rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
          
          {/* Remote Video (Full Screen) */}
          <div className="absolute inset-0 bg-surface-container">
            {remoteStream ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white gap-6">
                 <div className="w-32 h-32 rounded-full overflow-hidden bg-white/10 flex items-center justify-center ring-2 ring-white/20 animate-pulse">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${remoteUser?.fullname?.firstname}`} alt="" className="w-full h-full object-cover opacity-50" />
                 </div>
                 <div className="text-center">
                   <h3 className="text-2xl font-bold mb-2">Calling {remoteUser?.fullname?.firstname}...</h3>
                   <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Waiting for response</p>
                 </div>
              </div>
            )}
          </div>

          {/* Local Video (PiP) */}
          <div className="absolute top-8 right-8 w-48 md:w-64 aspect-video bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-10">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Controls */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl z-20">
            <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <Mic size={24} />
            </button>
            <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <Video size={24} />
            </button>
            <button 
              onClick={endCall}
              className="p-4 rounded-full bg-error hover:bg-error/80 text-white transition-colors mx-2"
            >
              <PhoneOff size={28} />
            </button>
            <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <Maximize2 size={24} />
            </button>
            <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X size={24} onClick={endCall} />
            </button>
          </div>

          {/* Info Overlay */}
          <div className="absolute top-8 left-8 flex items-center gap-4 p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 z-20">
            <div className="w-10 h-10 rounded-full overflow-hidden">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${remoteUser?.fullname?.firstname}`} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{remoteUser?.fullname?.firstname} {remoteUser?.fullname?.lastname}</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Live Connection</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default VideoCallModal;
