import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const VideoCallContext = createContext();

export const VideoCallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user: currentUser } = useAuth();
  
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, incoming, ongoing
  const [remoteUser, setRemoteUser] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingSignal, setIncomingSignal] = useState(null);
  
  const peerConnection = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pendingCandidates = useRef([]);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  const cleanupCall = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setRemoteUser(null);
    setIncomingSignal(null);
    pendingCandidates.current = [];
  }, [localStream]);

  const initPeerConnection = useCallback((targetUserId) => {
    peerConnection.current = new RTCPeerConnection(configuration);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { to: targetUserId, candidate: event.candidate });
      }
    };

    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    return peerConnection.current;
  }, [socket]);

  const startCall = async (targetUser) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setRemoteUser(targetUser);
      setCallStatus('calling');

      const pc = initPeerConnection(targetUser._id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call-user', {
        to: targetUser._id,
        offer,
        from: {
          _id: currentUser._id,
          fullname: currentUser.fullname,
        }
      });
    } catch (err) {
      console.error('Error starting call:', err);
      toast.error('Could not access camera/microphone');
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setCallStatus('ongoing');

      const pc = initPeerConnection(remoteUser._id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer-call', { to: remoteUser._id, answer });

      // Process any pending ICE candidates
      pendingCandidates.current.forEach(candidate => {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      });
      pendingCandidates.current = [];
    } catch (err) {
      console.error('Error accepting call:', err);
      toast.error('Could not access camera/microphone');
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (remoteUser) {
      socket.emit('reject-call', { to: remoteUser._id });
    }
    cleanupCall();
  };

  const endCall = () => {
    if (remoteUser) {
      socket.emit('end-call', { to: remoteUser._id });
    }
    cleanupCall();
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('incoming-call', ({ from, offer }) => {
      setRemoteUser(from);
      setIncomingSignal(offer);
      setCallStatus('incoming');
    });

    socket.on('call-answered', async ({ answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus('ongoing');
        
        // Process any pending ICE candidates
        pendingCandidates.current.forEach(candidate => {
          peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        });
        pendingCandidates.current = [];
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidates.current.push(candidate);
      }
    });

    socket.on('call-rejected', () => {
      toast.error('Call rejected');
      cleanupCall();
    });

    socket.on('call-ended', () => {
      toast('Call ended');
      cleanupCall();
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-answered');
      socket.off('ice-candidate');
      socket.off('call-rejected');
      socket.off('call-ended');
    };
  }, [socket, cleanupCall]);

  return (
    <VideoCallContext.Provider value={{
      callStatus,
      remoteUser,
      localStream,
      remoteStream,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      localVideoRef,
      remoteVideoRef
    }}>
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => useContext(VideoCallContext);
