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
    console.log("socket connected")
    if (user) {
      const newSocket = io('http://localhost:9000');
      setSocket(newSocket);

      newSocket.emit('join', { userId: user._id });

      newSocket.on('swap-request', (data) => {
        toast.success(`New swap request from ${data.fromUser?.fullname?.firstname || 'a user'}!`, {
          duration: 5000,
          icon: '🤝',
        });
      });

      return () => {
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
