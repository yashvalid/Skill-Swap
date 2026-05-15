import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Search,
  Sparkles,
  CheckCheck,
  User
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useVideoCall } from '../context/VideoCallContext';
import { useNavigate } from 'react-router-dom';
import { messageService } from '../services/messageService';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';
import { skillService } from '../services/skillService';
import { swapService } from '../services/swapService';

const Messaging = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { startCall } = useVideoCall();
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatUsers, setChatUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        if (activeChatUser && (data.senderId === activeChatUser._id || data.receiverId === activeChatUser._id)) {
          setMessages((prev) => [...prev, data]);
          console.log(data);
        }
      };

      socket.on('new-message', handleNewMessage);

      return () => {
        socket.off('new-message', handleNewMessage);
      };
    }
  }, [socket, activeChatUser]);

  useEffect(() => {
    if (activeChatUser) {
      fetchMessages();
    }
  }, [activeChatUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUsers = async () => {
    try {
      const response = await swapService.getAcceptedSwaps();
      setChatUsers(response.data.allUsers || []);
      console.log(response.data.allUsers)
    } catch (error) {
      console.error('Failed to fetch chat users');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data } = await messageService.getMessages(activeChatUser._id);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatUser) return;

    try {
      const { data } = await messageService.sendMessage({
        text: newMessage,
        receiverId: activeChatUser._id
      });
      // The message will be added via socket or manual update if socket didn't broadcast to sender
      setMessages((prev) => [...prev, data.messages]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  if (!currentUser) return <div className="container py-20 text-center">Please login to access messaging.</div>;

  return (
    <div className="container py-8 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex-grow flex bg-white rounded-[2rem] shadow-xl overflow-hidden border border-outline-variant">

        {/* Chat List */}
        <div className="w-full md:w-80 border-r border-outline-variant flex flex-col">
          <div className="p-6 border-b border-outline-variant">
            <h2 className="font-bold text-xl mb-6" style={{ fontFamily: 'var(--font-display)' }}>Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
              <input
                type="text"
                placeholder="Search partners..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container-low border-none text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto no-scrollbar">
            {chatUsers.map(chat => (
              <div
                key={chat._id}
                onClick={() => setActiveChatUser(chat.otherUser)}
                className={`p-4 flex gap-4 cursor-pointer hover:bg-surface-container-low transition-colors ${activeChatUser?._id === chat.otherUser._id ? 'bg-surface-container border-l-4 border-primary' : ''}`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.otherUser.fullname?.firstname}`} alt="" />
                  </div>
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm truncate">{chat.otherUser.fullname?.firstname} {chat.otherUser.fullname?.lastname}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant truncate">{chat.otherUser?.role}</p>
                </div>
              </div>
            ))}
            {chatUsers.length === 0 && !loading && (
              <p className="p-8 text-center text-xs text-on-surface-variant italic">No partners found.</p>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="hidden md:flex flex-grow flex-col relative">
          {activeChatUser ? (
            <>
              {/* Header */}
              <div className="p-4 px-8 border-b border-outline-variant flex items-center justify-between glass sticky top-0 z-10">
                <div 
                  className="flex items-center gap-4 cursor-pointer group"
                  onClick={() => navigate(`/profile/${activeChatUser._id}`)}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container ring-2 ring-transparent group-hover:ring-primary transition-all">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChatUser.fullname?.firstname}`} alt="" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{activeChatUser.fullname?.firstname} {activeChatUser.fullname?.lastname}</h3>
                    <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Active Participant</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-3 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors"><Phone size={18} /></button>
                  <button
                    onClick={() => startCall(activeChatUser)}
                    className="p-3 rounded-full hover:bg-surface-container-low text-primary transition-colors"
                  >
                    <Video size={18} />
                  </button>
                  <button className="p-3 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors"><MoreVertical size={18} /></button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-grow p-8 overflow-y-auto space-y-6 no-scrollbar bg-surface/30">
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser._id;
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`px-6 py-4 rounded-3xl text-sm font-medium shadow-sm ${isMe
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-white text-on-surface rounded-tl-none border border-outline-variant/30'
                          }`}>
                          {msg.text}
                        </div>
                        <div className="flex items-center gap-2 px-2">
                          <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && <CheckCheck size={12} className="text-primary" />}
                        </div>
                      </div>
                      <div ref={messagesEndRef} />
                    </div>
                  );
                })}

              </div>

              {/* Footer Input */}
              <div className="p-6 bg-white border-t border-outline-variant">
                <form onSubmit={handleSendMessage} className="flex items-center gap-4 p-2 pl-4 rounded-2xl bg-surface-container-low border border-transparent focus-within:border-primary/20 transition-all">
                  <button type="button" className="text-on-surface-variant hover:text-primary transition-colors"><Paperclip size={20} /></button>
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-grow bg-transparent border-none outline-none py-2 text-sm font-medium"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary p-3 rounded-xl disabled:opacity-50" disabled={!newMessage.trim()}>
                    <Send size={18} />
                  </button>
                </form>
              </div>

            </>
          ) : (
            <div className="flex-grow flex items-center justify-center p-8 text-center bg-surface/30">
              <div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <Sparkles size={32} />
                </div>
                <h3 className="font-bold mb-2">Select a partner to start swapping</h3>
                <p className="text-sm text-on-surface-variant max-w-xs mx-auto">Choose an expert or a learner from the list to begin your knowledge exchange journey.</p>
              </div>
            </div>
          )}

        </div>

        {/* Mobile Placeholder */}
        {!activeChatUser && (
          <div className="md:hidden flex-grow flex items-center justify-center p-8 text-center bg-surface">
            <div>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <Sparkles size={32} />
              </div>
              <h3 className="font-bold mb-2">Knowledge is meant to be shared</h3>
              <p className="text-sm text-on-surface-variant">Select a contact below to open your chat.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
