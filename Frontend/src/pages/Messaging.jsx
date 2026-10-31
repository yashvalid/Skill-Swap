import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Video,
  Search,
  Sparkles,
  ArrowLeft,
  MessageSquare,
  Bot,
  User,
  Zap,
  Target,
  FileCode,
  HelpCircle,
  RotateCcw,
  ArrowDown,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useVideoCall } from '../context/VideoCallContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { messageService } from '../services/messageService';
import { aiService } from '../services/aiService';
import { swapService } from '../services/swapService';
import { userService } from '../services/userService';
import {
  getOrInitUserKeyPair,
  getOrDeriveSharedKey,
  encryptMessageText,
  decryptMessageText
} from '../utils/e2ee';

const SKILLBOT_USER = {
  _id: 'skillbot',
  isBot: true,
  fullname: { firstname: 'SkillBot', lastname: 'AI' },
  role: 'AI Study Assistant'
};

const DEFAULT_BOT_MESSAGE = {
  _id: 'welcome',
  senderId: 'skillbot',
  text: "Hey! I'm SkillBot. Ask me anything about what you're learning?from coding and design to languages and music?or get help planning your next swap session.",
  createdAt: new Date().toISOString()
};

const getInitialBotMessages = (userId) => {
  if (!userId) return [DEFAULT_BOT_MESSAGE];
  try {
    const saved = localStorage.getItem(`skillbot_messages_${userId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load saved SkillBot messages:', err);
  }
  return [DEFAULT_BOT_MESSAGE];
};

const QUICK_PROMPTS = [
  { label: "Practice exercises", icon: <HelpCircle size={12} />, prompt: "Give me 3 practice exercises or quiz questions for my skill" },
  { label: "Prepare for swap", icon: <Target size={12} />, prompt: "Help me prepare for my upcoming skill swap session" },
  { label: "Conversation practice", icon: <MessageSquare size={12} />, prompt: "Help me practice conversational dialogue or speaking points for my skill" },
  { label: "Structure 30-min session", icon: <FileCode size={12} />, prompt: "How should I structure a 30-minute swap session?" }
];

const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const sortByRecentMessage = (users) => {
  return [...users].sort((a, b) => {
    const timeA = a.lastMessageAt || (a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0);
    const timeB = b.lastMessageAt || (b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0);
    return timeB - timeA;
  });
};

const Messaging = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { startCall } = useVideoCall();

  const [activeChatUser, setActiveChatUser] = useState(SKILLBOT_USER);
  const [chatUsers, setChatUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [botMessages, setBotMessages] = useState(() => getInitialBotMessages(currentUser?._id));
  const [botLoading, setBotLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showScrollBottomPill, setShowScrollBottomPill] = useState(false);

  // E2EE States
  const [userKeyPair, setUserKeyPair] = useState(null);
  const [partnerSharedKey, setPartnerSharedKey] = useState(null);
  const [isE2EEActive, setIsE2EEActive] = useState(false);

  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isSwitchingChatRef = useRef(true);
  const prevMessagesCountRef = useRef(0);

  // Initialize E2EE Key Pair
  useEffect(() => {
    if (!currentUser?._id) return;
    let isCancelled = false;
    const initCrypto = async () => {
      try {
        const keyInfo = await getOrInitUserKeyPair(currentUser._id);
        if (keyInfo && !isCancelled) {
          setUserKeyPair(keyInfo);
          if (keyInfo.isNew || !currentUser.publicKey) {
            await userService.updateProfile({ publicKey: keyInfo.publicKeyJwkString });
          }
        }
      } catch (err) {
        console.warn('[E2EE] Key initialization error:', err);
      }
    };
    initCrypto();
    return () => { isCancelled = true; };
  }, [currentUser?._id, currentUser?.publicKey]);

  // Derive E2EE Shared Key for Active Conversation
  useEffect(() => {
    let isCancelled = false;
    const deriveKeyForChat = async () => {
      if (!activeChatUser || activeChatUser.isBot || !userKeyPair?.privateKey) {
        setPartnerSharedKey(null);
        setIsE2EEActive(false);
        return;
      }

      let partnerPubKey = activeChatUser.publicKey;
      if (!partnerPubKey && activeChatUser._id && !activeChatUser._id.startsWith('peer-')) {
        try {
          const res = await userService.getUserById(activeChatUser._id);
          partnerPubKey = res.data?.user?.publicKey;
        } catch (e) {}
      }

      if (partnerPubKey && !isCancelled) {
        const derivedKey = await getOrDeriveSharedKey(userKeyPair.privateKey, activeChatUser._id, partnerPubKey);
        if (!isCancelled && derivedKey) {
          setPartnerSharedKey(derivedKey);
          setIsE2EEActive(true);
          return;
        }
      }

      if (!isCancelled) {
        setPartnerSharedKey(null);
        setIsE2EEActive(false);
      }
    };

    deriveKeyForChat();
    return () => { isCancelled = true; };
  }, [activeChatUser, userKeyPair]);

  // Sync botMessages to localStorage on change
  useEffect(() => {
    if (!currentUser?._id) return;
    try {
      localStorage.setItem(`skillbot_messages_${currentUser._id}`, JSON.stringify(botMessages));
    } catch (err) {
      console.warn('Failed to persist SkillBot messages:', err);
    }
  }, [botMessages, currentUser?._id]);

  // Sync if currentUser changes
  useEffect(() => {
    if (currentUser?._id) {
      setBotMessages(getInitialBotMessages(currentUser._id));
    }
  }, [currentUser?._id]);

  const handleClearBotChat = () => {
    const resetMsg = [
      {
        _id: Date.now().toString(),
        senderId: 'skillbot',
        text: "Conversation reset. What would you like to practice today?",
        createdAt: new Date().toISOString()
      }
    ];
    setBotMessages(resetMsg);
    if (currentUser?._id) {
      try {
        localStorage.setItem(`skillbot_messages_${currentUser._id}`, JSON.stringify(resetMsg));
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const isNearBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= 150;
  };

  const scrollToBottom = (behavior = 'smooth') => {
    const container = scrollContainerRef.current;
    if (container) {
      if (behavior === 'auto') {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
    setShowScrollBottomPill(false);
  };

  const handleScroll = () => {
    if (isNearBottom()) {
      setShowScrollBottomPill(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userKeyPair]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = async (data) => {
        let processedData = data;
        if (data.isEncrypted && data.iv) {
          let currentKey = partnerSharedKey;
          if (!currentKey && userKeyPair?.privateKey && activeChatUser?.publicKey) {
            currentKey = await getOrDeriveSharedKey(userKeyPair.privateKey, activeChatUser._id, activeChatUser.publicKey);
          }
          if (currentKey) {
            const decrypted = await decryptMessageText(data.text, data.iv, currentKey);
            processedData = { ...data, text: decrypted, isDecrypted: true };
          } else {
            processedData = { ...data, text: '[Encrypted message]', isDecrypted: false };
          }
        }

        if (activeChatUser && !activeChatUser.isBot && (data.senderId === activeChatUser._id || data.receiverId === activeChatUser._id)) {
          setMessages((prev) => {
            if (data._id && prev.some((m) => m._id === data._id)) return prev;
            return [...prev, processedData];
          });
        }

        // Reorder recipient list: partner with latest message moves to top
        const partnerId = data.senderId === currentUser?._id ? data.receiverId : data.senderId;
        const msgTime = new Date(data.createdAt || Date.now()).getTime();

        setChatUsers((prev) => {
          const updated = prev.map((item) => {
            if (item.otherUser?._id === partnerId) {
              return {
                ...item,
                lastMessage: processedData,
                lastMessageAt: msgTime,
              };
            }
            return item;
          });
          return sortByRecentMessage(updated);
        });
      };

      socket.on('new-message', handleNewMessage);

      return () => {
        socket.off('new-message', handleNewMessage);
      };
    }
  }, [socket, activeChatUser, currentUser?._id, partnerSharedKey, userKeyPair]);

  useEffect(() => {
    isSwitchingChatRef.current = true;
    setShowScrollBottomPill(false);
    if (activeChatUser && !activeChatUser.isBot) {
      fetchMessages();
    } else if (activeChatUser?.isBot) {
      requestAnimationFrame(() => {
        scrollToBottom('auto');
        isSwitchingChatRef.current = false;
      });
    }
  }, [activeChatUser]);

  const currentChatMessages = activeChatUser?.isBot ? botMessages : messages;

  useEffect(() => {
    const currentCount = currentChatMessages.length;
    const prevCount = prevMessagesCountRef.current;
    prevMessagesCountRef.current = currentCount;

    // Opening or switching chat: immediately snap to the bottom to see latest message
    if (isSwitchingChatRef.current) {
      requestAnimationFrame(() => {
        scrollToBottom('auto');
        isSwitchingChatRef.current = false;
      });
      return;
    }

    if (currentCount <= prevCount) return;

    const lastMessage = currentChatMessages[currentCount - 1];
    const isSentByMe = lastMessage?.senderId === currentUser?._id;

    if (isSentByMe) {
      // Sent by current user: scroll down smoothly
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    } else {
      // Incoming message from peer or bot:
      // Only scroll down if user is ALREADY near the bottom!
      if (isNearBottom()) {
        requestAnimationFrame(() => {
          scrollToBottom('smooth');
        });
      } else {
        // Scrolled up reading history: DO NOT auto-scroll down!
        setShowScrollBottomPill(true);
      }
    }
  }, [currentChatMessages, currentUser?._id]);

  useEffect(() => {
    if (botLoading && isNearBottom()) {
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    }
  }, [botLoading]);

  const fetchUsers = async () => {
    try {
      const response = await swapService.getAcceptedSwaps();
      const users = response.data.allUsers || [];
      
      const processedUsers = await Promise.all(
        users.map(async (item) => {
          if (item.lastMessage?.isEncrypted && item.lastMessage?.iv && userKeyPair?.privateKey && item.otherUser?.publicKey) {
            try {
              const key = await getOrDeriveSharedKey(userKeyPair.privateKey, item.otherUser._id, item.otherUser.publicKey);
              if (key) {
                const dec = await decryptMessageText(item.lastMessage.text, item.lastMessage.iv, key);
                return {
                  ...item,
                  lastMessage: {
                    ...item.lastMessage,
                    text: dec,
                    isDecrypted: true
                  }
                };
              }
            } catch (e) {}
          }
          return item;
        })
      );
      setChatUsers(sortByRecentMessage(processedUsers));
    } catch (error) {
      console.error('Failed to fetch chat users', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data } = await messageService.getMessages(activeChatUser._id);
      const rawMessages = data.messages || [];

      // Determine shared key if needed
      let currentKey = partnerSharedKey;
      if (!currentKey && userKeyPair?.privateKey) {
        let partnerPubKey = activeChatUser.publicKey;
        if (!partnerPubKey && activeChatUser._id && !activeChatUser._id.startsWith('peer-')) {
          try {
            const res = await userService.getUserById(activeChatUser._id);
            partnerPubKey = res.data?.user?.publicKey;
          } catch (e) {}
        }
        if (partnerPubKey) {
          currentKey = await getOrDeriveSharedKey(userKeyPair.privateKey, activeChatUser._id, partnerPubKey);
          if (currentKey) {
            setPartnerSharedKey(currentKey);
            setIsE2EEActive(true);
          }
        }
      }

      const processed = await Promise.all(
        rawMessages.map(async (msg) => {
          if (msg.isEncrypted && msg.iv) {
            if (currentKey) {
              const decrypted = await decryptMessageText(msg.text, msg.iv, currentKey);
              return { ...msg, text: decrypted, isDecrypted: true };
            }
            return { ...msg, text: '[Encrypted message]', isDecrypted: false };
          }
          return msg;
        })
      );

      setMessages(processed);
      requestAnimationFrame(() => {
        scrollToBottom('auto');
        isSwitchingChatRef.current = false;
      });
    } catch (error) {
      console.error('Failed to fetch messages', error);
      setMessages([]);
      isSwitchingChatRef.current = false;
    }
  };

  const handleSelectChat = (user) => {
    if (activeChatUser?._id !== user._id) {
      isSwitchingChatRef.current = true;
      setShowScrollBottomPill(false);
      setActiveChatUser(user);
      setMobileView('chat');
    }
  };

  const handleSendMessage = async (textToSend) => {
    const messageText = (textToSend || newMessage).trim();
    if (!messageText || !activeChatUser) return;

    setNewMessage('');

    if (activeChatUser.isBot) {
      const userMsg = {
        _id: Date.now().toString(),
        senderId: currentUser._id,
        text: messageText,
        createdAt: new Date().toISOString()
      };
      setBotMessages(prev => [...prev, userMsg]);
      setBotLoading(true);

      try {
        const history = botMessages.map(m => ({
          role: m.senderId === 'skillbot' ? 'assistant' : 'user',
          text: m.text
        }));

        const res = await aiService.askTutor({
          message: messageText,
          history
        });

        const botReply = {
          _id: (Date.now() + 1).toString(),
          senderId: 'skillbot',
          text: res.data?.reply || "Got it! What area would you like to explore next?",
          createdAt: new Date().toISOString()
        };
        setBotMessages(prev => [...prev, botReply]);
      } catch (err) {
        setBotMessages(prev => [
          ...prev,
          {
            _id: (Date.now() + 1).toString(),
            senderId: 'skillbot',
            text: "Sorry, I couldn't process that request. Please try again.",
            createdAt: new Date().toISOString()
          }
        ]);
      } finally {
        setBotLoading(false);
      }
    } else {
      try {
        let currentKey = partnerSharedKey;
        if (!currentKey && userKeyPair?.privateKey) {
          let partnerPubKey = activeChatUser.publicKey;
          if (!partnerPubKey && activeChatUser._id && !activeChatUser._id.startsWith('peer-')) {
            try {
              const res = await userService.getUserById(activeChatUser._id);
              partnerPubKey = res.data?.user?.publicKey;
            } catch (e) {}
          }
          if (partnerPubKey) {
            currentKey = await getOrDeriveSharedKey(userKeyPair.privateKey, activeChatUser._id, partnerPubKey);
            if (currentKey) {
              setPartnerSharedKey(currentKey);
              setIsE2EEActive(true);
            }
          }
        }

        let payload = {
          receiverId: activeChatUser._id,
          text: messageText,
        };

        if (currentKey) {
          const encrypted = await encryptMessageText(messageText, currentKey);
          payload.text = encrypted.ciphertext;
          payload.isEncrypted = true;
          payload.iv = encrypted.iv;
        }

        const response = await messageService.sendMessage(payload);
        const savedMessage = response.data?.messages || response.data?.data || response.data;
        if (savedMessage) {
          const localMessage = {
            ...savedMessage,
            text: messageText, // Display plaintext locally
            isEncrypted: Boolean(payload.isEncrypted),
            isDecrypted: Boolean(payload.isEncrypted)
          };

          setMessages((prev) => {
            if (savedMessage._id && prev.some((m) => m._id === savedMessage._id)) return prev;
            return [...prev, localMessage];
          });

          // Reorder recipient list: active partner moves to top
          const msgTime = new Date(savedMessage.createdAt || Date.now()).getTime();
          setChatUsers((prev) => {
            const updated = prev.map((item) => {
              if (item.otherUser?._id === activeChatUser._id) {
                return {
                  ...item,
                  lastMessage: localMessage,
                  lastMessageAt: msgTime,
                };
              }
              return item;
            });
            return sortByRecentMessage(updated);
          });
        }
      } catch (error) {
        console.error('Failed to send message', error);
        toast.error('Failed to send message');
      }
    }
  };

  const filteredChatUsers = sortByRecentMessage(chatUsers).filter((u) => {
    const partner = u.otherUser;
    if (!partner) return false;
    const name = `${partner.fullname?.firstname} ${partner.fullname?.lastname}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  if (!currentUser) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-6">
        <div className="ui-card p-8 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
          <h3 className="heading-h2 text-[#F5F6FA] mb-2">Authentication Required</h3>
          <p className="body-md text-xs text-[#A4B0BE] mb-6">
            Sign in to coordinate with mentors and message your active swap partners.
          </p>
          <button onClick={() => navigate('/login')} className="btn btn-primary w-full py-2.5">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="ui-card bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none overflow-hidden h-[78vh] flex shadow-2xl">
        
        {/* Left Side: Channel List */}
        <div className={`w-full md:w-80 border-r border-[rgba(255,255,255,0.1)] flex flex-col bg-[#2B313A] shrink-0 ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-[rgba(255,255,255,0.08)] bg-[#242A32]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs uppercase text-[#55E6C1] font-semibold tracking-wider">
                Conversations
              </span>
              <span className="tag-chip text-[9px]">
                {chatUsers.length + 1} ACTIVE
              </span>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718093]" size={14} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-8 py-1.5 text-xs rounded-none bg-[#2B313A]"
              />
            </div>
          </div>

          {/* Contact Items */}
          <div className="flex-grow overflow-y-auto p-2 space-y-1">
            {/* SkillBot */}
            <div
              onClick={() => handleSelectChat(SKILLBOT_USER)}
              className={`p-3 rounded-none flex items-center gap-3 cursor-pointer transition-colors border ${
                activeChatUser?.isBot
                  ? 'bg-[#6C5CE7] text-white border-[#6C5CE7] font-semibold'
                  : 'hover:bg-[#242A32] border-transparent text-[#F5F6FA]'
              }`}
            >
              <div className={`w-9 h-9 rounded-none flex items-center justify-center shrink-0 font-mono font-bold text-xs ${
                activeChatUser?.isBot ? 'bg-[#2F3640] text-[#55E6C1]' : 'bg-[#55E6C1] text-[#2F3640]'
              }`}>
                <Bot size={18} />
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs tracking-wide">SkillBot</span>
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-none font-semibold ${
                    activeChatUser?.isBot ? 'bg-[#2F3640] text-[#55E6C1]' : 'bg-[#242A32] text-[#55E6C1]'
                  }`}>
                    AI BOT
                  </span>
                </div>
                <p className={`text-[11px] truncate ${
                  activeChatUser?.isBot ? 'text-white/80' : 'text-[#A4B0BE]'
                }`}>
                  Instant practice & study help
                </p>
              </div>
            </div>

            <div className="px-3 pt-3 pb-1 font-mono text-[10px] uppercase text-[#718093]">
              Swap Partners ({filteredChatUsers.length})
            </div>

            {filteredChatUsers.map((chat) => {
              const partner = chat.otherUser;
              if (!partner) return null;
              const isSelected = activeChatUser?._id === partner._id;
              const initials = `${partner.fullname?.firstname?.[0] || 'P'}${partner.fullname?.lastname?.[0] || ''}`;
              const lastMsgText = chat.lastMessage?.text;
              const lastMsgTime = chat.lastMessage?.createdAt ? formatMessageTime(chat.lastMessage.createdAt) : '';

              return (
                <div
                  key={chat.swapId || partner._id}
                  onClick={() => handleSelectChat(partner)}
                  className={`p-2.5 rounded-none flex items-center gap-3 cursor-pointer transition-colors border ${
                    isSelected
                      ? 'bg-[#353B48] border-[#6C5CE7] text-[#F5F6FA] font-bold'
                      : 'hover:bg-[#242A32] border-transparent text-[#A4B0BE]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-none bg-[#6C5CE7] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline gap-1">
                      <p className="font-bold text-xs truncate text-[#F5F6FA]">
                        {partner.fullname?.firstname} {partner.fullname?.lastname}
                      </p>
                      {lastMsgTime && (
                        <span className="font-mono text-[9px] text-[#718093] shrink-0">
                          {lastMsgTime}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#A4B0BE] truncate">
                      {lastMsgText ? (
                        <span>
                          {chat.lastMessage?.senderId === currentUser?._id ? (
                            <span className="text-[#55E6C1]">You: </span>
                          ) : null}
                          {lastMsgText}
                        </span>
                      ) : (
                        partner.role || 'Partner'
                      )}
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredChatUsers.length === 0 && !loading && (
              <div className="p-6 text-center font-mono text-xs text-[#718093] italic">
                No active conversations yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Conversation Panel */}
        <div className={`flex-grow flex flex-col relative bg-[#2F3640] ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}>
          {activeChatUser ? (
            <>
              {/* Header */}
              <div className="p-3.5 px-6 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between bg-[#2B313A]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 rounded-none hover:bg-[#242A32] text-[#A4B0BE]"
                    aria-label="Back"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  <div className="w-8 h-8 rounded-none bg-[#6C5CE7] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {activeChatUser.isBot ? <Bot size={16} /> : (activeChatUser.fullname?.firstname?.[0] || 'U')}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F6FA] leading-tight">
                      {activeChatUser.fullname?.firstname} {activeChatUser.fullname?.lastname}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-[#55E6C1] font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-none bg-[#55E6C1]" />
                        {activeChatUser.isBot ? 'AI ASSISTANT' : 'SWAP PARTNER'}
                      </span>
                      {!activeChatUser.isBot && isE2EEActive && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono text-[#55E6C1] bg-[#242A32] px-1.5 py-0.5 border border-[rgba(85,230,193,0.3)]">
                          <Lock size={9} /> E2E Encrypted
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!activeChatUser.isBot ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startCall(activeChatUser)}
                      className="btn btn-cta text-xs py-1.5 px-3 flex items-center gap-1.5 font-mono"
                    >
                      <Video size={13} />
                      <span>Video Call</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleClearBotChat}
                      className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-mono"
                      title="Reset SkillBot conversation history"
                    >
                      <RotateCcw size={13} />
                      <span className="hidden sm:inline">Reset Chat</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Message Feed */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-3.5 bg-[#2F3640]"
              >
                {activeChatUser.isBot && (
                  <div className="mb-4 p-3.5 rounded-none bg-[#2B313A] border border-[rgba(255,255,255,0.08)]">
                    <span className="font-mono text-[10px] text-[#A4B0BE] uppercase block mb-2 font-semibold">
                      Suggested Prompts
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_PROMPTS.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(p.prompt)}
                          className="tag-chip text-xs hover:bg-[#6C5CE7] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          {p.icon}
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!activeChatUser.isBot && isE2EEActive && (
                  <div className="flex justify-center my-3">
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#242A32] border border-[rgba(85,230,193,0.25)] text-[#A4B0BE] text-[10px] font-mono max-w-md text-center">
                      <Lock size={12} className="text-[#55E6C1] shrink-0" />
                      <span>Messages in this conversation are end-to-end encrypted. No one outside of this chat can read them.</span>
                    </div>
                  </div>
                )}

                {currentChatMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser._id;
                  const isBotMsg = msg.senderId === 'skillbot';
                  const isCallRecord = msg.messageType === 'call' || msg.text?.startsWith('📹') || msg.text?.startsWith('📞');

                  if (isCallRecord) {
                    const isMissedOrDeclined = msg.callDetails?.status === 'missed' || 
                                              msg.callDetails?.status === 'declined' || 
                                              msg.text?.includes('Missed') || 
                                              msg.text?.includes('Declined');
                    return (
                      <div key={msg._id} className="flex justify-center my-2.5">
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#242A32] border border-[rgba(255,255,255,0.12)] rounded-none shadow-sm max-w-md w-full sm:w-auto">
                          <div className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 ${
                            isMissedOrDeclined 
                              ? 'bg-[#FF7675]/20 text-[#FF7675] border border-[rgba(255,118,117,0.3)]' 
                              : 'bg-[#55E6C1]/20 text-[#55E6C1] border border-[rgba(85,230,193,0.3)]'
                          }`}>
                            <Video size={15} />
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="font-mono text-xs font-bold text-[#F5F6FA] truncate">
                              {msg.text}
                            </p>
                            <span className="font-mono text-[9px] text-[#A4B0BE] block">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          {!activeChatUser.isBot && (
                            <button
                              type="button"
                              onClick={() => startCall(activeChatUser)}
                              className="px-2.5 py-1 text-[11px] font-mono bg-[#6C5CE7] hover:bg-[#5b4bd8] text-white rounded-none shrink-0 transition-colors cursor-pointer"
                              title="Start Video Call"
                            >
                              Call Back
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div
                          className={`px-4 py-2.5 rounded-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                            isMe
                              ? 'bg-[#6C5CE7] text-white font-medium shadow-sm'
                              : isBotMsg
                              ? 'bg-[#2B313A] text-[#F5F6FA] border border-[rgba(85,230,193,0.3)] shadow-xs'
                              : 'bg-[#353B48] text-[#F5F6FA] border border-[rgba(255,255,255,0.1)] shadow-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="font-mono text-[9px] text-[#718093] px-1 flex items-center gap-1">
                          {msg.isEncrypted && (
                            <span className="text-[#55E6C1] inline-flex items-center" title="End-to-End Encrypted">
                              <Lock size={9} />
                            </span>
                          )}
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Shimmer skeleton for bot response (no circular spinner per DESIGN.md) */}
                {botLoading && (
                  <div className="flex justify-start w-64">
                    <div className="p-3 rounded-none bg-[#2B313A] border border-[rgba(255,255,255,0.1)] w-full space-y-2">
                      <div className="h-3 w-1/3 skeleton-shimmer" />
                      <div className="h-4 w-full skeleton-shimmer" />
                      <div className="h-4 w-4/5 skeleton-shimmer" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Floating Pill: Jump to latest message when scrolled up */}
              {showScrollBottomPill && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20">
                  <button
                    onClick={() => scrollToBottom('smooth')}
                    className="btn btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 font-mono shadow-xl border border-[rgba(255,255,255,0.2)]"
                  >
                    <ArrowDown size={13} />
                    <span>New message &bull; Jump to latest</span>
                  </button>
                </div>
              )}

              {/* Input Area */}
              <div className="p-3.5 border-t border-[rgba(255,255,255,0.1)] bg-[#2B313A]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2 items-center"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={activeChatUser.isBot ? "Ask SkillBot anything..." : "Write a message..."}
                    className="input-field text-xs sm:text-sm py-2 rounded-none bg-[#242A32]"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="btn btn-primary text-xs py-2 px-4 rounded-none shrink-0 disabled:opacity-40"
                  >
                    <Send size={14} />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center p-6 text-center text-[#A4B0BE]">
              Select a conversation to start chatting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messaging;
