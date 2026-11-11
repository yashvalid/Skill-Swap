import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());
  const [swapEvent, setSwapEvent] = useState({ version: 0, type: null });
  const socketRef = useRef(null);
  const { user } = useAuth();
  const userId = user?._id;

  useEffect(() => {
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
      }
      setOnlineUsers(new Set());
      return;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_BASE_URL ||
      'http://localhost:9000';
    const token = localStorage.getItem('token');

    const newSocket = io(socketUrl, {
      withCredentials: true,
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    const handleJoin = () => {
      newSocket.emit('join');
    };

    const handleOnlineUsers = (ids) => {
      if (Array.isArray(ids)) {
        setOnlineUsers(new Set(ids.map(String)));
      }
    };

    const handlePresenceUpdate = ({ userId: peerId, online }) => {
      if (!peerId) return;
      const key = peerId.toString();
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (online) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
    };

    const bumpSwapEvent = (type) => {
      setSwapEvent((prev) => ({ version: prev.version + 1, type }));
    };

    const handleSwapRequest = (data) => {
      const payload = data?.swapReq || data;
      const firstName = payload?.fromUser?.fullname?.firstname || 'a peer';
      toast.success(`New swap request from ${firstName}!`, {
        duration: 5000,
        icon: '🤝',
      });
      bumpSwapEvent('swap-request');
    };

    const handleSwapAccepted = () => {
      toast.success('Your swap request was accepted!', { duration: 4000, icon: '✅' });
      bumpSwapEvent('swap-accepted');
    };

    const handleSwapRejected = () => {
      toast('A pending swap request was declined', { icon: 'ℹ️' });
      bumpSwapEvent('swap-rejected');
    };

    const handleSwapRescheduled = () => {
      toast('A swap session was rescheduled', { icon: '📅' });
      bumpSwapEvent('swap-rescheduled');
    };

    const handleSwapCompleted = () => {
      toast.success('Swap milestone certified! +1 Skill Credit earned', { duration: 5000, icon: '🏆' });
      bumpSwapEvent('swap-completed');
    };

    newSocket.on('connect', handleJoin);
    if (newSocket.connected) {
      handleJoin();
    }
    newSocket.on('online-users', handleOnlineUsers);
    newSocket.on('presence-update', handlePresenceUpdate);
    newSocket.on('swap-request', handleSwapRequest);
    newSocket.on('swap-accepted', handleSwapAccepted);
    newSocket.on('swap-rejected', handleSwapRejected);
    newSocket.on('swap-rescheduled', handleSwapRescheduled);
    newSocket.on('swap-completed', handleSwapCompleted);

    const heartbeatTimer = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('presence-heartbeat');
      }
    }, 45000);

    return () => {
      clearInterval(heartbeatTimer);
      newSocket.off('connect', handleJoin);
      newSocket.off('online-users', handleOnlineUsers);
      newSocket.off('presence-update', handlePresenceUpdate);
      newSocket.off('swap-request', handleSwapRequest);
      newSocket.off('swap-accepted', handleSwapAccepted);
      newSocket.off('swap-rejected', handleSwapRejected);
      newSocket.off('swap-rescheduled', handleSwapRescheduled);
      newSocket.off('swap-completed', handleSwapCompleted);
      newSocket.close();
      if (socketRef.current === newSocket) {
        socketRef.current = null;
      }
      setSocket(null);
    };
  }, [userId]);

  const isUserOnline = useCallback(
    (peerId) => Boolean(peerId && onlineUsers.has(peerId.toString())),
    [onlineUsers]
  );

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isUserOnline, swapEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);
