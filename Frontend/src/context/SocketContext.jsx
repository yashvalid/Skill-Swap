import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
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

    const handleSwapRequest = (data) => {
      const payload = data?.swapReq || data;
      const firstName = payload?.fromUser?.fullname?.firstname || 'a peer';
      toast.success(`New swap request from ${firstName}!`, {
        duration: 5000,
        icon: '🤝',
      });
    };

    newSocket.on('connect', handleJoin);
    if (newSocket.connected) {
      handleJoin();
    }
    newSocket.on('swap-request', handleSwapRequest);

    return () => {
      newSocket.off('connect', handleJoin);
      newSocket.off('swap-request', handleSwapRequest);
      newSocket.close();
      if (socketRef.current === newSocket) {
        socketRef.current = null;
      }
      setSocket(null);
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);
