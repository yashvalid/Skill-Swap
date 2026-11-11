import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const VideoCallContext = createContext();

const ICE_CONFIGURATION = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const VideoCallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user: currentUser } = useAuth();

  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'ongoing'
  const [remoteUser, setRemoteUser] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingSignal, setIncomingSignal] = useState(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);

  // Live mutable refs to eliminate stale closure bugs and prevent socket listener churn
  const callStatusRef = useRef(callStatus);
  callStatusRef.current = callStatus;

  const remoteUserRef = useRef(remoteUser);
  remoteUserRef.current = remoteUser;

  const callDurationRef = useRef(callDuration);
  callDurationRef.current = callDuration;

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const localStreamRef = useRef(null);
  localStreamRef.current = localStream;

  const peerConnection = useRef(null);
  const pendingCandidates = useRef([]);
  const screenStreamRef = useRef(null);
  const ringTimeoutRef = useRef(null);
  const audioCtxRef = useRef(null);
  const ringtoneOscRef = useRef(null);

  const stopAudioTone = useCallback(() => {
    try {
      if (ringtoneOscRef.current) {
        ringtoneOscRef.current.stop();
        ringtoneOscRef.current.disconnect();
        ringtoneOscRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch {
      // Audio context already stopped
    }
  }, []);

  const startAudioTone = useCallback((type = 'incoming') => {
    try {
      stopAudioTone();
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'incoming') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      ringtoneOscRef.current = osc;
    } catch {
      // Autoplay permissions may require user interaction
    }
  }, [stopAudioTone]);

  useEffect(() => {
    let timer = null;
    if (callStatus === 'ongoing') {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanupCall = useCallback(() => {
    stopAudioTone();

    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    setIsMuted(false);
    setIsVideoDisabled(false);

    if (peerConnection.current) {
      peerConnection.current.onicecandidate = null;
      peerConnection.current.ontrack = null;
      peerConnection.current.oniceconnectionstatechange = null;
      peerConnection.current.onconnectionstatechange = null;
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // Track already stopped
        }
      });
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setIsAnswering(false);
    setRemoteUser(null);
    setIncomingSignal(null);
    pendingCandidates.current = [];
  }, [stopAudioTone]);

  const getMediaStream = async () => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
    } catch (err) {
      console.warn('[WebRTC] Standard video acquisition failed, attempting simple video/audio:', err.name);
      if (err.name === 'NotAllowedError') {
        throw new Error('Camera and microphone permissions were denied in browser');
      }

      try {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err2) {
        console.warn('[WebRTC] Video fallback failed, acquiring audio only:', err2.name);
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          toast('Connected in audio-only mode (camera unavailable)', { icon: '🎙️' });
          return audioStream;
        } catch {
          throw new Error('Could not access microphone or camera device');
        }
      }
    }
  };

  const initPeerConnection = useCallback((targetUserId) => {
    const pc = new RTCPeerConnection(ICE_CONFIGURATION);
    peerConnection.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          to: targetUserId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else if (event.track) {
        setRemoteStream(prev => {
          const stream = prev || new MediaStream();
          stream.addTrack(event.track);
          return stream;
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'failed') {
        try {
          pc.restartIce();
        } catch {
          // Ignore restartIce unsupported error
        }
      } else if (state === 'disconnected') {
        toast('Connection unstable, attempting to reconnect...', { id: 'webrtc-reconnect' });
      } else if (state === 'connected') {
        toast.dismiss('webrtc-reconnect');
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'failed') {
        toast.error('Sync session disconnected');
        cleanupCall();
      } else if (state === 'closed') {
        cleanupCall();
      }
    };

    return pc;
  }, [socket, cleanupCall]);

  const addCandidateSafely = async (candidate) => {
    if (!peerConnection.current || !candidate) return;
    try {
      if (peerConnection.current.remoteDescription && peerConnection.current.remoteDescription.type) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidates.current.push(candidate);
      }
    } catch (err) {
      console.warn('[WebRTC] Ignored ICE candidate timing error:', err.message);
    }
  };

  const endCall = useCallback(() => {
    stopAudioTone();
    const targetUser = remoteUserRef.current;
    const currentStatus = callStatusRef.current;
    const userMe = currentUserRef.current;

    if (targetUser && socket) {
      if (currentStatus === 'calling') {
        socket.emit('cancel-call', {
          to: targetUser._id,
          from: userMe?._id
        });
      } else {
        socket.emit('end-call', {
          to: targetUser._id,
          from: userMe?._id,
          duration: currentStatus === 'ongoing' ? callDurationRef.current : 0
        });
      }
    }
    cleanupCall();
  }, [socket, stopAudioTone, cleanupCall]);

  const startCall = async (targetUser) => {
    if (!socket) {
      toast.error('Real-time socket offline. Please refresh.');
      return;
    }
    if (!targetUser?._id) {
      toast.error('Invalid exchange recipient');
      return;
    }

    try {
      const stream = await getMediaStream();
      localStreamRef.current = stream;
      setLocalStream(stream);
      setRemoteUser(targetUser);
      setCallStatus('calling');
      startAudioTone('calling');

      const pc = initPeerConnection(targetUser._id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      socket.emit('call-user', {
        to: targetUser._id,
        offer
      });

      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = setTimeout(() => {
        if (callStatusRef.current === 'calling') {
          toast('No response from partner (call timed out)', { icon: '⏱️' });
          endCall();
        }
      }, 45000);
    } catch (err) {
      console.error('Error starting call:', err);
      toast.error(err.message || 'Could not initiate video call');
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    stopAudioTone();
    setIsAnswering(true);
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    const targetUser = remoteUserRef.current;
    if (!incomingSignal || !targetUser?._id) {
      setIsAnswering(false);
      cleanupCall();
      return;
    }

    try {
      const stream = await getMediaStream();
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCallStatus('ongoing');

      const pc = initPeerConnection(targetUser._id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer-call', {
        to: targetUser._id,
        answer
      });

      if (pendingCandidates.current.length > 0) {
        for (const cand of pendingCandidates.current) {
          await addCandidateSafely(cand);
        }
        pendingCandidates.current = [];
      }
    } catch (err) {
      console.error('Error accepting call:', err);
      toast.error(err.message || 'Could not accept call');
      cleanupCall();
    } finally {
      setIsAnswering(false);
    }
  };

  const rejectCall = () => {
    stopAudioTone();
    const targetUser = remoteUserRef.current;
    if (targetUser && socket) {
      socket.emit('reject-call', {
        to: targetUser._id,
        from: currentUserRef.current?._id,
        reason: 'declined'
      });
    }
    cleanupCall();
  };

  const toggleMic = () => {
    if (localStream) {
      const nextMuted = !isMuted;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
      setIsMuted(nextMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const nextDisabled = !isVideoDisabled;
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !nextDisabled;
      });
      setIsVideoDisabled(nextDisabled);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    if (localStream && peerConnection.current) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const sender = peerConnection.current.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
    }
    setIsScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        toast.error('Screen sharing is not supported by your browser');
        return;
      }
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        if (peerConnection.current) {
          const sender = peerConnection.current.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
        toast.success('Screen share active');
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          toast.error('Could not share screen');
        }
      }
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({ from, offer }) => {
      if (callStatusRef.current !== 'idle') {
        socket.emit('reject-call', { to: from._id, reason: 'busy' });
        return;
      }

      setRemoteUser(from);
      setIncomingSignal(offer);
      setCallStatus('incoming');
      startAudioTone('incoming');

      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = setTimeout(() => {
        if (callStatusRef.current === 'incoming') {
          toast('Call timed out', { icon: '⏱️' });
          cleanupCall();
        }
      }, 45000);
    };

    const handleCallAnswered = async ({ answer }) => {
      stopAudioTone();
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }

      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
          setCallStatus('ongoing');

          if (pendingCandidates.current.length > 0) {
            for (const cand of pendingCandidates.current) {
              await addCandidateSafely(cand);
            }
            pendingCandidates.current = [];
          }
        } catch (err) {
          console.error('[WebRTC] Error setting answer:', err);
        }
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (peerConnection.current && peerConnection.current.remoteDescription?.type) {
        await addCandidateSafely(candidate);
      } else {
        pendingCandidates.current.push(candidate);
      }
    };

    const handleCallRejected = (data) => {
      stopAudioTone();
      if (data?.reason === 'busy') {
        toast.error(data.message || 'Partner is currently in another exchange call');
      } else {
        toast.error('Call declined by partner');
      }
      cleanupCall();
    };

    const handleCallCancelled = () => {
      stopAudioTone();
      toast('Call cancelled by caller', { icon: '📞' });
      cleanupCall();
    };

    const handleCallFailed = (data) => {
      stopAudioTone();
      toast.error(data?.message || 'Call failed: partner offline');
      cleanupCall();
    };

    const handleCallEnded = (data) => {
      stopAudioTone();
      const duration = (data?.duration && data.duration > 0) ? data.duration : callDurationRef.current;
      toast(duration > 0 ? `Video sync ended • ${formatDuration(duration)}` : 'Call ended', { icon: '📞' });
      cleanupCall();
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-answered', handleCallAnswered);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-cancelled', handleCallCancelled);
    socket.on('call-failed', handleCallFailed);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-answered', handleCallAnswered);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-cancelled', handleCallCancelled);
      socket.off('call-failed', handleCallFailed);
      socket.off('call-ended', handleCallEnded);
    };
  }, [socket, cleanupCall, startAudioTone, stopAudioTone]);

  return (
    <VideoCallContext.Provider value={{
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
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleMic,
      toggleVideo,
      toggleScreenShare
    }}>
      {children}
    </VideoCallContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useVideoCall = () => useContext(VideoCallContext);
