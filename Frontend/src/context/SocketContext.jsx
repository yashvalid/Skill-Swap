import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL || 'http://localhost:9000';
      const newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });
      setSocket(newSocket);

      const handleJoin = () => {
        newSocket.emit('join', { userId: user._id });
      };

      newSocket.on('connect', handleJoin);
      handleJoin();

      newSocket.on('swap-request', (data) => {
        toast.success(`New swap request from ${data.fromUser?.fullname?.firstname || 'a user'}!`, {
          duration: 5000,
          icon: '🤝',
        });
      });

      return () => {
        newSocket.off('connect', handleJoin);
        newSocket.off('swap-request');
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
