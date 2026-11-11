import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Calendar,
  X,
  Check,
  CheckCheck,
  KeyRound,
  Download,
  Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useVideoCall } from '../context/VideoCallContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { messageService } from '../services/messageService';
import { aiService } from '../services/aiService';
import { swapService } from '../services/swapService';
import { userService } from '../services/userService';
import { formatSessionDate } from '../utils/calendar';
import {
  getOrInitUserKeyPair,
  getOrDeriveSharedKey,
  encryptMessageText,
  decryptMessageText,
  clearSharedKeyCacheForPartner,
  exportUserKeyBackup,
  importUserKeyBackup,
  encryptKeyBackupWithPassword,
  decryptKeyBackupWithPassword
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
  text: "Hey! I'm SkillBot. Ask me anything about what you're learning — from coding and design to languages and music — or get help planning your next swap session.",
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

const TIME_SLOTS = [
  { time: '10:00', label: '10:00 AM' },
  { time: '11:30', label: '11:30 AM' },
  { time: '14:00', label: '02:00 PM' },
  { time: '16:00', label: '04:00 PM' },
  { time: '18:00', label: '06:00 PM' },
  { time: '19:30', label: '07:30 PM' }
];

const Messaging = () => {
  const { user: currentUser, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, isUserOnline, swapEvent } = useSocket();
  const { startCall } = useVideoCall();

  const [activeChatUser, setActiveChatUser] = useState(SKILLBOT_USER);
  const [chatUsers, setChatUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [botMessages, setBotMessages] = useState(() => getInitialBotMessages(currentUser?._id));
  const [botLoading, setBotLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showScrollBottomPill, setShowScrollBottomPill] = useState(false);

  // In-Chat Scheduling Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [scheduleSlot, setScheduleSlot] = useState('14:00');
  const [scheduleDuration, setScheduleDuration] = useState(45);
  const [scheduling, setScheduling] = useState(false);

  // E2EE States & Key Backup Modal
  const [userKeyPair, setUserKeyPair] = useState(null);
  const [partnerSharedKey, setPartnerSharedKey] = useState(null);
  const [isE2EEActive, setIsE2EEActive] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [vaultPassword, setVaultPassword] = useState('');
  const [syncingVault, setSyncingVault] = useState(false);
  const [backupInput, setBackupInput] = useState('');
  const [importingKeys, setImportingKeys] = useState(false);

  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isSwitchingChatRef = useRef(true);
  const isPrependingRef = useRef(false);
  const prevMessagesCountRef = useRef(0);
  const lastTypingEmitRef = useRef(0);
  const typingTimeoutRef = useRef(null);
  const partnerTypingTimeoutRef = useRef(null);
  const activeChatUserRef = useRef(activeChatUser);
  activeChatUserRef.current = activeChatUser;
  const userKeyPairRef = useRef(userKeyPair);
  userKeyPairRef.current = userKeyPair;
  const partnerSharedKeyRef = useRef(partnerSharedKey);
  partnerSharedKeyRef.current = partnerSharedKey;
  const refreshedPartnerKeysRef = useRef(new Set());
  const derivedKeysByPartnerRef = useRef(new Map());
  const rawMessagesRef = useRef([]);
  const messagesRef = useRef([]);
  messagesRef.current = messages;
  const chatUsersRef = useRef([]);
  chatUsersRef.current = chatUsers;

  const activePartnerId = activeChatUser?.isBot ? null : activeChatUser?._id || null;

  const resolvePartnerSharedKey = useCallback(async (partnerUser, { forceRefresh = false } = {}) => {
    const partnerId = partnerUser?._id;
    const privKey = userKeyPairRef.current?.privateKey;
    if (!privKey || !partnerId || partnerId === 'skillbot' || partnerId.startsWith('peer-')) {
      return null;
    }

    if (!forceRefresh && derivedKeysByPartnerRef.current.has(partnerId)) {
      const cached = derivedKeysByPartnerRef.current.get(partnerId);
      if (activeChatUserRef.current?._id === partnerId) {
        partnerSharedKeyRef.current = cached;
        setPartnerSharedKey(cached);
        setIsE2EEActive(true);
      }
      return cached;
    }

    let partnerPubKey = forceRefresh ? null : partnerUser.publicKey;
    if (!partnerPubKey) {
      try {
        const res = await userService.getUserById(partnerId);
        partnerPubKey = res.data?.user?.publicKey || null;
      } catch (err) {
        console.warn('[E2EE] Partner public key lookup skipped:', err.message);
      }
    }
    if (!partnerPubKey) return null;

    if (forceRefresh) {
      clearSharedKeyCacheForPartner(partnerId);
    }

    const sharedKey = await getOrDeriveSharedKey(privKey, partnerId, partnerPubKey);
    if (sharedKey) {
      derivedKeysByPartnerRef.current.set(partnerId, sharedKey);
      if (activeChatUserRef.current?._id === partnerId) {
        partnerSharedKeyRef.current = sharedKey;
        setPartnerSharedKey(sharedKey);
        setIsE2EEActive(true);
      }
    }
    return sharedKey;
  }, []);

  // Initialize E2EE Key Pair
  useEffect(() => {
    if (!currentUser?._id) return;
    let isCancelled = false;
    const initCrypto = async () => {
      try {
        const keyInfo = await getOrInitUserKeyPair(currentUser._id);
        if (keyInfo && !isCancelled) {
          derivedKeysByPartnerRef.current.clear();
          refreshedPartnerKeysRef.current.clear();
          userKeyPairRef.current = keyInfo;
          setUserKeyPair(keyInfo);
          if (keyInfo.isNew || !currentUser.publicKey || currentUser.publicKey !== keyInfo.publicKeyJwkString) {
            const res = await userService.updateProfile({ publicKey: keyInfo.publicKeyJwkString });
            if (res.data?.user && !isCancelled) {
              setUser(res.data.user);
            }
          }
        }
      } catch (err) {
        console.warn('[E2EE] Key initialization error:', err);
      }
    };
    initCrypto();
    return () => { isCancelled = true; };
  }, [currentUser?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive E2EE Shared Key for Active Conversation
  useEffect(() => {
    let isCancelled = false;
    const deriveKeyForChat = async () => {
      if (!activePartnerId || !userKeyPair?.privateKey) {
        partnerSharedKeyRef.current = null;
        setPartnerSharedKey(null);
        setIsE2EEActive(false);
        return;
      }

      const partnerObj = activeChatUserRef.current;
      const derivedKey = await resolvePartnerSharedKey(partnerObj);
      if (!isCancelled && !derivedKey) {
        partnerSharedKeyRef.current = null;
        setPartnerSharedKey(null);
        setIsE2EEActive(false);
      }
    };

    deriveKeyForChat();
    return () => { isCancelled = true; };
  }, [activePartnerId, userKeyPair, resolvePartnerSharedKey]);

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

  const handleSelectChat = useCallback((user) => {
    setActiveChatUser(prev => {
      if (prev?._id === user._id) return prev;
      isSwitchingChatRef.current = true;
      setShowScrollBottomPill(false);
      const cachedKey = user?.isBot ? null : (derivedKeysByPartnerRef.current.get(user._id) || null);
      partnerSharedKeyRef.current = cachedKey;
      setPartnerSharedKey(cachedKey);
      setIsE2EEActive(Boolean(cachedKey));
      if (!user?.isBot) {
        setMessages([]);
        rawMessagesRef.current = [];
      }
      return user;
    });
    setMobileView('chat');
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await swapService.getAcceptedSwaps();
      const rawUsers = response.data.allUsers || [];

      // Keep one conversation entry per unique partner
      const uniquePartnersMap = new Map();
      for (const item of rawUsers) {
        const pid = item.otherUser?._id;
        if (!pid) continue;
        if (!uniquePartnersMap.has(pid)) {
          uniquePartnersMap.set(pid, item);
        }
      }
      const users = Array.from(uniquePartnersMap.values());

      const processedUsers = await Promise.all(
        users.map(async (item) => {
          if (item.lastMessage?.isEncrypted && item.lastMessage?.iv) {
            try {
              const key = await resolvePartnerSharedKey(item.otherUser);
              if (key) {
                let dec = await decryptMessageText(item.lastMessage.text, item.lastMessage.iv, key);
                if (dec === '[Unable to decrypt message]' && !refreshedPartnerKeysRef.current.has(`prev:${item.otherUser?._id}`)) {
                  refreshedPartnerKeysRef.current.add(`prev:${item.otherUser?._id}`);
                  const freshKey = await resolvePartnerSharedKey(item.otherUser, { forceRefresh: true });
                  if (freshKey) {
                    dec = await decryptMessageText(item.lastMessage.text, item.lastMessage.iv, freshKey);
                  }
                }
                return {
                  ...item,
                  lastMessage: {
                    ...item.lastMessage,
                    _cipherText: item.lastMessage.text,
                    text: dec,
                    isDecrypted: dec !== '[Unable to decrypt message]'
                  }
                };
              }
              return {
                ...item,
                lastMessage: {
                  ...item.lastMessage,
                  _cipherText: item.lastMessage.text,
                  isDecrypted: false
                }
              };
            } catch (err) {
              console.warn('[E2EE] Last message decryption skipped:', err.message);
            }
          }
          return item;
        })
      );
      setChatUsers(sortByRecentMessage(processedUsers));

      if (location.state?.partnerId) {
        const found = processedUsers.find(u => u.otherUser?._id === location.state.partnerId);
        if (found?.otherUser) {
          handleSelectChat(found.otherUser);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chat users', error);
    } finally {
      setLoading(false);
    }
  }, [location.state?.partnerId, handleSelectChat, resolvePartnerSharedKey]);

  useEffect(() => {
    if (currentUser?._id) {
      fetchUsers();
    }
  }, [currentUser?._id, fetchUsers, swapEvent]);

  // Re-decrypt sidebar lastMessage previews locally once E2EE keypair loads or keys are restored
  useEffect(() => {
    if (!userKeyPair?.privateKey || chatUsersRef.current.length === 0) return;
    const hasPendingPreview = chatUsersRef.current.some(
      (item) => item.lastMessage?.isEncrypted && !item.lastMessage?.isDecrypted && item.lastMessage?.iv && (item.lastMessage?._cipherText || item.lastMessage?.text)
    );
    if (!hasPendingPreview) return;

    let cancelled = false;
    const decryptPreviews = async () => {
      const updated = await Promise.all(
        chatUsersRef.current.map(async (item) => {
          const cipherText = item.lastMessage?._cipherText || item.lastMessage?.text;
          if (item.lastMessage?.isEncrypted && !item.lastMessage?.isDecrypted && item.lastMessage?.iv && cipherText) {
            try {
              let key = await resolvePartnerSharedKey(item.otherUser);
              if (key) {
                let dec = await decryptMessageText(cipherText, item.lastMessage.iv, key);
                if (dec === '[Unable to decrypt message]' && !refreshedPartnerKeysRef.current.has(`prev:${item.otherUser?._id}`)) {
                  refreshedPartnerKeysRef.current.add(`prev:${item.otherUser?._id}`);
                  const freshKey = await resolvePartnerSharedKey(item.otherUser, { forceRefresh: true });
                  if (freshKey) {
                    key = freshKey;
                    dec = await decryptMessageText(cipherText, item.lastMessage.iv, freshKey);
                  }
                }
                return {
                  ...item,
                  lastMessage: {
                    ...item.lastMessage,
                    _cipherText: cipherText,
                    text: dec,
                    isDecrypted: dec !== '[Unable to decrypt message]'
                  }
                };
              }
            } catch {
              // Keep existing preview
            }
          }
          return item;
        })
      );
      if (!cancelled) {
        setChatUsers(sortByRecentMessage(updated));
      }
    };
    decryptPreviews();
    return () => { cancelled = true; };
  }, [userKeyPair, loading, resolvePartnerSharedKey]);

  const decryptMessageBatch = useCallback(async (rawMessages, partnerUser) => {
    let activeKey = await resolvePartnerSharedKey(partnerUser);
    let attemptedRefresh = partnerUser?._id ? refreshedPartnerKeysRef.current.has(`retry:${partnerUser._id}`) : true;

    const decryptedBatch = await Promise.all(
      rawMessages.map(async (msg) => {
        if (!msg.isEncrypted || !msg.iv) return msg;
        if (!activeKey) return { ...msg, _cipherText: msg.text, text: '[Encrypted message]', isDecrypted: false };

        let decrypted = await decryptMessageText(msg.text, msg.iv, activeKey);
        if (decrypted === '[Unable to decrypt message]' && !attemptedRefresh && partnerUser?._id) {
          attemptedRefresh = true;
          refreshedPartnerKeysRef.current.add(`retry:${partnerUser._id}`);
          const refreshedKey = await resolvePartnerSharedKey(partnerUser, { forceRefresh: true });
          if (refreshedKey) {
            activeKey = refreshedKey;
            decrypted = await decryptMessageText(msg.text, msg.iv, refreshedKey);
          }
        }
        return {
          ...msg,
          _cipherText: msg.text,
          text: decrypted,
          isDecrypted: decrypted !== '[Unable to decrypt message]'
        };
      })
    );

    return decryptedBatch;
  }, [resolvePartnerSharedKey]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = async (data) => {
      const partnerId = data.senderId === currentUser?._id ? data.receiverId : data.senderId;
      let processedData = data;

      if (data.isEncrypted && data.iv) {
        const partnerEntry = chatUsersRef.current.find(u => u.otherUser?._id === partnerId);
        const partnerObj = partnerEntry?.otherUser || (partnerId === activeChatUserRef.current?._id ? activeChatUserRef.current : { _id: partnerId });
        let currentKey = await resolvePartnerSharedKey(partnerObj);

        if (currentKey) {
          let decrypted = await decryptMessageText(data.text, data.iv, currentKey);
          if (decrypted === '[Unable to decrypt message]' && !refreshedPartnerKeysRef.current.has(`sock:${partnerId}`)) {
            refreshedPartnerKeysRef.current.add(`sock:${partnerId}`);
            const refreshedKey = await resolvePartnerSharedKey(partnerObj, { forceRefresh: true });
            if (refreshedKey) {
              currentKey = refreshedKey;
              decrypted = await decryptMessageText(data.text, data.iv, refreshedKey);
            }
          }
          processedData = {
            ...data,
            _cipherText: data.text,
            text: decrypted,
            isDecrypted: decrypted !== '[Unable to decrypt message]'
          };
        } else {
          processedData = { ...data, _cipherText: data.text, text: '[Encrypted message]', isDecrypted: false };
        }
      }

      const currentOpenPartner = activeChatUserRef.current;
      const isFromOpenPartner = currentOpenPartner && !currentOpenPartner.isBot && data.senderId === currentOpenPartner._id;
      if (isFromOpenPartner) {
        setPartnerTyping(false);
        messageService.markSeen(currentOpenPartner._id).catch(() => {});
      }

      if (currentOpenPartner && !currentOpenPartner.isBot && (data.senderId === currentOpenPartner._id || data.receiverId === currentOpenPartner._id)) {
        setMessages((prev) => {
          if (data._id && prev.some((m) => m._id === data._id)) return prev;
          return [...prev, processedData];
        });
      }

      const msgTime = new Date(data.createdAt || Date.now()).getTime();
      setChatUsers((prev) => {
        const updated = prev.map((item) => {
          if (item.otherUser?._id === partnerId) {
            const shouldIncrementUnread = data.senderId !== currentUser?._id && !isFromOpenPartner;
            return {
              ...item,
              lastMessage: processedData,
              lastMessageAt: msgTime,
              unreadCount: shouldIncrementUnread ? (item.unreadCount || 0) + 1 : 0,
            };
          }
          return item;
        });
        return sortByRecentMessage(updated);
      });
    };

    const handleChatTyping = ({ from, isTyping }) => {
      if (from !== activeChatUserRef.current?._id) return;
      setPartnerTyping(Boolean(isTyping));
      if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
      if (isTyping) {
        partnerTypingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3200);
      }
    };

    const handleMessagesSeen = ({ by }) => {
      if (by === activeChatUserRef.current?._id) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === currentUser?._id ? { ...m, isSeen: true } : m))
        );
      }
      setChatUsers((prev) =>
        prev.map((item) =>
          item.otherUser?._id === by && item.lastMessage
            ? { ...item, lastMessage: { ...item.lastMessage, isSeen: true } }
            : item
        )
      );
    };

    socket.on('new-message', handleNewMessage);
    socket.on('chat-typing', handleChatTyping);
    socket.on('messages-seen', handleMessagesSeen);
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('chat-typing', handleChatTyping);
      socket.off('messages-seen', handleMessagesSeen);
      if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
    };
  }, [socket, currentUser?._id, resolvePartnerSharedKey]);

  const fetchMessages = useCallback(async (partnerId) => {
    const partnerObj = activeChatUserRef.current;
    if (!partnerId || !partnerObj || partnerObj.isBot) return;
    setPartnerTyping(false);
    rawMessagesRef.current = [];
    try {
      const { data } = await messageService.getMessages(partnerId, { limit: 40 });
      if (activeChatUserRef.current?._id !== partnerId) return;

      const rawMessages = data.messages || [];
      rawMessagesRef.current = rawMessages;
      setHasMoreMessages(Boolean(data.hasMore));

      const processed = await decryptMessageBatch(rawMessages, partnerObj);
      if (activeChatUserRef.current?._id !== partnerId) return;

      setMessages(processed);

      const hasUnseenIncoming = rawMessages.some(
        (m) => m.senderId === partnerId && !m.isSeen
      );
      if (hasUnseenIncoming) {
        messageService.markSeen(partnerId).catch(() => {});
      }
      setChatUsers((prev) =>
        prev.map((item) =>
          item.otherUser?._id === partnerId ? { ...item, unreadCount: 0 } : item
        )
      );

      requestAnimationFrame(() => {
        scrollToBottom('auto');
        isSwitchingChatRef.current = false;
      });
    } catch (error) {
      console.error('Failed to fetch messages', error);
      setMessages([]);
      setHasMoreMessages(false);
      isSwitchingChatRef.current = false;
    }
  }, [decryptMessageBatch]);

  const handleLoadOlderMessages = async () => {
    if (!activeChatUser?._id || activeChatUser.isBot || loadingOlder || !hasMoreMessages || messages.length === 0) {
      return;
    }
    const oldestTimestamp = messages[0]?.createdAt;
    if (!oldestTimestamp) return;

    setLoadingOlder(true);
    const prevScrollHeight = scrollContainerRef.current?.scrollHeight || 0;
    try {
      const { data } = await messageService.getMessages(activeChatUser._id, {
        limit: 40,
        before: oldestTimestamp
      });
      const olderRaw = data.messages || [];
      rawMessagesRef.current = [...olderRaw, ...rawMessagesRef.current];
      setHasMoreMessages(Boolean(data.hasMore));

      const olderProcessed = await decryptMessageBatch(olderRaw, activeChatUser);
      isPrependingRef.current = true;
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m._id));
        const uniqueOlder = olderProcessed.filter((m) => !existingIds.has(m._id));
        return [...uniqueOlder, ...prev];
      });

      requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } catch {
      toast.error('Failed to load older messages');
    } finally {
      setLoadingOlder(false);
    }
  };

  useEffect(() => {
    isSwitchingChatRef.current = true;
    setShowScrollBottomPill(false);
    if (activePartnerId) {
      fetchMessages(activePartnerId);
    } else if (activeChatUser?.isBot) {
      requestAnimationFrame(() => {
        scrollToBottom('auto');
        isSwitchingChatRef.current = false;
      });
    }
  }, [activePartnerId, activeChatUser?.isBot, fetchMessages]);

  // In-memory re-decryption when shared key finishes deriving or keys are restored (no extra HTTP call)
  useEffect(() => {
    if (!partnerSharedKey || !activePartnerId) return;
    const current = messagesRef.current;
    const needsDecrypt = current.some((m) => m.isEncrypted && m._cipherText && !m.isDecrypted);
    if (!needsDecrypt) return;

    let cancelled = false;
    Promise.all(
      current.map(async (m) => {
        if (m.isEncrypted && !m.isDecrypted && m._cipherText && m.iv) {
          const dec = await decryptMessageText(m._cipherText, m.iv, partnerSharedKey);
          return { ...m, text: dec, isDecrypted: dec !== '[Unable to decrypt message]' };
        }
        return m;
      })
    ).then((updated) => {
      if (!cancelled) {
        isPrependingRef.current = true;
        setMessages(updated);
      }
    });
    return () => { cancelled = true; };
  }, [partnerSharedKey, activePartnerId]);

  const currentChatMessages = activeChatUser?.isBot ? botMessages : messages;

  useEffect(() => {
    const currentCount = currentChatMessages.length;
    const prevCount = prevMessagesCountRef.current;
    prevMessagesCountRef.current = currentCount;

    if (isSwitchingChatRef.current) {
      requestAnimationFrame(() => {
        scrollToBottom('auto');
        isSwitchingChatRef.current = false;
      });
      return;
    }

    if (isPrependingRef.current) {
      isPrependingRef.current = false;
      return;
    }

    if (currentCount <= prevCount) return;

    const lastMessage = currentChatMessages[currentCount - 1];
    const isSentByMe = lastMessage?.senderId === currentUser?._id;

    if (isSentByMe) {
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    } else if (isNearBottom()) {
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    } else {
      setShowScrollBottomPill(true);
    }
  }, [currentChatMessages, currentUser?._id]);

  useEffect(() => {
    if (botLoading && isNearBottom()) {
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    }
  }, [botLoading]);

  const handleOpenSchedule = () => {
    setScheduleDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setScheduleSlot('14:00');
    setScheduleDuration(45);
    setScheduleModalOpen(true);
  };

  const handleConfirmSchedule = async (e) => {
    e.preventDefault();
    if (!activeChatUser || !scheduleDate) return;
    setScheduling(true);
    try {
      const userSwap = chatUsers.find(u => u.otherUser?._id === activeChatUser._id);
      const swapId = userSwap?.swapId;
      const scheduledTime = new Date(`${scheduleDate}T${scheduleSlot}:00`).toISOString();

      if (swapId) {
        await swapService.rescheduleSwap({
          swapId,
          scheduledTime,
          durationMinutes: scheduleDuration
        });
      }

      const formatted = formatSessionDate(scheduledTime);
      await handleSendMessage(`📅 Scheduled our next 1-on-1 swap session for ${formatted} (${scheduleDuration} mins). Added to calendar!`);
      toast.success('Session scheduled and shared in chat!');
      setScheduleModalOpen(false);
    } catch (err) {
      console.error('Failed to schedule session in chat', err);
      toast.error('Failed to schedule session');
    } finally {
      setScheduling(false);
    }
  };

  const emitTypingStatus = useCallback((isTyping) => {
    if (!socket || !activeChatUser?._id || activeChatUser.isBot) return;
    socket.emit('chat-typing', { to: activeChatUser._id, isTyping: Boolean(isTyping) });
  }, [socket, activeChatUser]);

  const handleMessageInputChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);

    if (!activeChatUser || activeChatUser.isBot) return;
    if (!val.trim()) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitTypingStatus(false);
      return;
    }

    const now = Date.now();
    if (now - lastTypingEmitRef.current > 1500) {
      lastTypingEmitRef.current = now;
      emitTypingStatus(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStatus(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleExportKeys = () => {
    if (!currentUser?._id) return;
    const backup = exportUserKeyBackup(currentUser._id);
    if (!backup) {
      toast.error('No E2EE keys initialized yet');
      return;
    }
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillswap-e2ee-backup-${currentUser._id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Encryption key backup downloaded');
  };

  const handleCopyKeyBackup = async () => {
    if (!currentUser?._id) return;
    const backup = exportUserKeyBackup(currentUser._id);
    if (!backup) {
      toast.error('No E2EE keys initialized yet');
      return;
    }
    await navigator.clipboard.writeText(backup);
    toast.success('Backup JSON copied to clipboard');
  };

  const applyRestoredPair = async (restored) => {
    const res = await userService.updateProfile({ publicKey: restored.publicKeyJwkString });
    if (res.data?.user) {
      setUser(res.data.user);
    }
    derivedKeysByPartnerRef.current.clear();
    refreshedPartnerKeysRef.current.clear();
    const nextPair = {
      privateKey: restored.privateKey,
      publicKeyJwkString: restored.publicKeyJwkString,
      isNew: false
    };
    userKeyPairRef.current = nextPair;
    setUserKeyPair(nextPair);
    partnerSharedKeyRef.current = null;
    setPartnerSharedKey(null);
    setMessages((prev) => prev.map((m) => (m._cipherText ? { ...m, isDecrypted: false } : m)));
    setChatUsers((prev) => prev.map((item) => (
      item.lastMessage?._cipherText
        ? { ...item, lastMessage: { ...item.lastMessage, isDecrypted: false } }
        : item
    )));
  };

  const handlePasswordVaultSync = async (e) => {
    e.preventDefault();
    if (!currentUser?._id || !vaultPassword) return;
    setSyncingVault(true);
    try {
      if (currentUser.encryptedKeyBackup) {
        const restored = await decryptKeyBackupWithPassword(vaultPassword, currentUser._id, currentUser.encryptedKeyBackup);
        await applyRestoredPair(restored);
        toast.success('Synced encrypted keys from your account!');
      } else {
        const encryptedKeyBackup = await encryptKeyBackupWithPassword(vaultPassword, currentUser._id);
        if (!encryptedKeyBackup) {
          throw new Error('Could not initialize encryption keys in this browser');
        }
        const res = await userService.updateProfile({
          publicKey: userKeyPairRef.current?.publicKeyJwkString,
          encryptedKeyBackup
        });
        if (res.data?.user) {
          setUser(res.data.user);
        }
        toast.success('Encryption key vault enabled on your account!');
      }
      setVaultPassword('');
      setKeyModalOpen(false);
    } catch (err) {
      toast.error(err.name === 'OperationError' ? 'Incorrect password for encrypted key vault' : (err.message || 'Could not sync key vault'));
    } finally {
      setSyncingVault(false);
    }
  };

  const handleImportKeys = async (e) => {
    e.preventDefault();
    if (!currentUser?._id || !backupInput.trim()) return;
    setImportingKeys(true);
    try {
      const restored = await importUserKeyBackup(currentUser._id, backupInput);
      await applyRestoredPair(restored);
      setBackupInput('');
      setKeyModalOpen(false);
      toast.success('E2EE keys restored! Re-decrypting messages...');
    } catch (err) {
      toast.error(err.message || 'Invalid key backup file');
    } finally {
      setImportingKeys(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const messageText = (textToSend || newMessage).trim();
    if (!messageText || !activeChatUser) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    emitTypingStatus(false);

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
      } catch {
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
        const currentKey = await resolvePartnerSharedKey(activeChatUser);

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
        <div className="ui-card p-8 bg-[#283144] border border-[rgba(255,255,255,0.12)] rounded-2xl">
          <h3 className="heading-h2 text-[#F7F8FC] mb-2">Authentication Required</h3>
          <p className="body-md text-xs text-[#A4B0C6] mb-6">
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
    <div className="max-w-[1280px] mx-auto px-2 sm:px-6 py-2 sm:py-8">
      <div className="ui-card bg-[#283144] border border-[rgba(255,255,255,0.12)] rounded-2xl overflow-hidden h-[calc(100dvh-5rem)] sm:h-[78vh] flex shadow-2xl">
        
        {/* Left Side: Channel List */}
        <div className={`w-full md:w-80 min-h-0 h-full border-r border-[rgba(255,255,255,0.1)] flex flex-col bg-[#202738] shrink-0 ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Header */}
          <div className="shrink-0 p-3 sm:p-4 border-b border-[rgba(255,255,255,0.08)] bg-[#171D2B]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs uppercase text-[#FFEEA8] font-semibold tracking-wider">
                Conversations
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setKeyModalOpen(true)}
                  className="tag-chip text-[9px] hover:bg-[#2B3F74] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  title="Backup or Restore E2EE Keys"
                >
                  <KeyRound size={10} />
                  <span>KEYS</span>
                </button>
                <span className="tag-chip text-[9px]">
                  {chatUsers.length + 1} ACTIVE
                </span>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71809B]" size={14} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-8 py-1.5 text-xs rounded-xl bg-[#202738]"
              />
            </div>
          </div>

          {/* Contact Items */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-1">
            {/* SkillBot */}
            <div
              onClick={() => handleSelectChat(SKILLBOT_USER)}
              className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors border ${
                activeChatUser?.isBot
                  ? 'bg-[#2B3F74] text-white border-[#2B3F74] font-semibold'
                  : 'hover:bg-[#171D2B] border-transparent text-[#F7F8FC]'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-mono font-bold text-xs ${
                activeChatUser?.isBot ? 'bg-[#202738] text-[#FFEEA8]' : 'bg-[#FFEEA8] text-[#202738]'
              }`}>
                <Bot size={18} />
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs tracking-wide">SkillBot</span>
                  <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                    activeChatUser?.isBot ? 'bg-[#202738] text-[#FFEEA8]' : 'bg-[#171D2B] text-[#FFEEA8]'
                  }`}>
                    AI BOT
                  </span>
                </div>
                <p className={`text-[11px] truncate ${
                  activeChatUser?.isBot ? 'text-white/80' : 'text-[#A4B0C6]'
                }`}>
                  Instant practice & study help
                </p>
              </div>
            </div>

            <div className="px-3 pt-3 pb-1 font-mono text-[10px] uppercase text-[#71809B]">
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
                  className={`p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-colors border ${
                    isSelected
                      ? 'bg-[#283144] border-[#2B3F74] text-[#F7F8FC] font-bold'
                      : 'hover:bg-[#171D2B] border-transparent text-[#A4B0C6]'
                  }`}
                >
                  <div className="relative w-8 h-8 rounded-full bg-[#2B3F74] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {initials}
                    {isUserOnline(partner._id) && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#22C55E] ring-2 ring-[#202738]"
                        title="Online"
                      />
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline gap-1">
                      <p className="font-bold text-xs truncate text-[#F7F8FC]">
                        {partner.fullname?.firstname} {partner.fullname?.lastname}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {chat.unreadCount > 0 && !isSelected && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFEEA8] text-[#171D2B] font-mono text-[9px] font-bold flex items-center justify-center">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </span>
                        )}
                        {lastMsgTime && (
                          <span className="font-mono text-[9px] text-[#71809B]">
                            {lastMsgTime}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-[#A4B0C6] truncate">
                      {lastMsgText ? (
                        <span>
                          {chat.lastMessage?.senderId === currentUser?._id ? (
                            <span className="text-[#FFEEA8]">You: </span>
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
              <div className="p-6 text-center font-mono text-xs text-[#71809B] italic">
                No active conversations yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Conversation Panel */}
        <div className={`flex-1 min-w-0 min-h-0 h-full flex flex-col relative bg-[#202738] ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}>
          {activeChatUser ? (
            <>
              {/* Header */}
              <div className="shrink-0 p-3 px-3 sm:px-6 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between bg-[#202738]">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 rounded-lg hover:bg-[#171D2B] text-[#A4B0C6] shrink-0"
                    aria-label="Back"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  <div className="w-8 h-8 rounded-full bg-[#2B3F74] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {activeChatUser.isBot ? <Bot size={16} /> : (activeChatUser.fullname?.firstname?.[0] || 'U')}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-[#F7F8FC] leading-tight truncate">
                      {activeChatUser.fullname?.firstname} {activeChatUser.fullname?.lastname}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {activeChatUser.isBot ? (
                        <span className="font-mono text-[9px] sm:text-[10px] text-[#FFEEA8] font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FFEEA8]" />
                          AI TUTOR
                        </span>
                      ) : (
                        <span className={`font-mono text-[9px] sm:text-[10px] font-medium flex items-center gap-1 ${
                          partnerTyping
                            ? 'text-[#FFEEA8]'
                            : isUserOnline(activeChatUser._id)
                            ? 'text-[#22C55E]'
                            : 'text-[#71809B]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            partnerTyping
                              ? 'bg-[#FFEEA8] animate-pulse'
                              : isUserOnline(activeChatUser._id)
                              ? 'bg-[#22C55E]'
                              : 'bg-[#71809B]'
                          }`} />
                          {partnerTyping ? 'TYPING...' : isUserOnline(activeChatUser._id) ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      )}
                      {!activeChatUser.isBot && isE2EEActive && (
                        <button
                          type="button"
                          onClick={() => setKeyModalOpen(true)}
                          className="inline-flex items-center gap-1 text-[9px] font-mono text-[#FFEEA8] bg-[#171D2B] px-2 py-0.5 rounded-full border border-[rgba(255,238,168,0.3)] hover:bg-[#283144] cursor-pointer"
                          title="Manage E2EE Keys"
                        >
                          <Lock size={9} /> <span className="hidden sm:inline">E2E Encrypted</span><span className="sm:hidden">E2EE</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!activeChatUser.isBot ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleOpenSchedule}
                      className="btn btn-secondary text-xs py-1.5 px-2.5 sm:px-3 flex items-center gap-1.5 font-mono text-[#FFEEA8] border-[rgba(255,238,168,0.25)] hover:bg-[#2B3F74]"
                      title="Schedule 1:1 session"
                    >
                      <Calendar size={13} className="text-[#FFEEA8]" />
                      <span className="hidden sm:inline">Schedule</span>
                    </button>

                    <button
                      onClick={() => startCall(activeChatUser)}
                      className="btn btn-cta text-xs py-1.5 px-2.5 sm:px-3 flex items-center gap-1.5 font-mono"
                    >
                      <Video size={13} />
                      <span className="hidden sm:inline">Video Call</span>
                      <span className="sm:hidden">Call</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={handleClearBotChat}
                      className="btn btn-secondary text-xs py-1.5 px-2.5 sm:px-3 flex items-center gap-1.5 font-mono"
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
                className="flex-1 min-h-0 p-3 sm:p-6 overflow-y-auto overscroll-contain space-y-3 sm:space-y-3.5 bg-[#202738]"
              >
                {activeChatUser.isBot && (
                  <div className="mb-4 p-3.5 rounded-xl bg-[#202738] border border-[rgba(255,255,255,0.08)]">
                    <span className="font-mono text-[10px] text-[#A4B0C6] uppercase block mb-2 font-semibold">
                      Suggested Prompts
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_PROMPTS.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(p.prompt)}
                          className="tag-chip text-xs hover:bg-[#2B3F74] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          {p.icon}
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!activeChatUser.isBot && hasMoreMessages && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadOlderMessages}
                      disabled={loadingOlder}
                      className="btn btn-secondary text-[11px] font-mono py-1.5 px-3 rounded-full disabled:opacity-50"
                    >
                      {loadingOlder ? 'Loading history...' : 'Load older messages'}
                    </button>
                  </div>
                )}

                {!activeChatUser.isBot && isE2EEActive && (
                  <div className="flex justify-center my-3">
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#171D2B] rounded-full border border-[rgba(255,238,168,0.25)] text-[#A4B0C6] text-[10px] font-mono max-w-md text-center">
                      <Lock size={12} className="text-[#FFEEA8] shrink-0" />
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
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#171D2B] border border-[rgba(255,255,255,0.12)] rounded-xl shadow-sm max-w-md w-full sm:w-auto">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isMissedOrDeclined 
                              ? 'bg-[#D72E2B]/20 text-[#D72E2B] border border-[rgba(215,46,43,0.3)]' 
                              : 'bg-[#FFEEA8]/20 text-[#FFEEA8] border border-[rgba(255,238,168,0.3)]'
                          }`}>
                            <Video size={15} />
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="font-mono text-xs font-bold text-[#F7F8FC] truncate">
                              {msg.text}
                            </p>
                            <span className="font-mono text-[9px] text-[#A4B0C6] block">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          {!activeChatUser.isBot && (
                            <button
                              type="button"
                              onClick={() => startCall(activeChatUser)}
                              className="px-2.5 py-1 text-[11px] font-mono bg-[#2B3F74] hover:bg-[#385296] text-white rounded-lg shrink-0 transition-colors cursor-pointer"
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
                          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                            isMe
                              ? 'bg-[#2B3F74] text-white font-medium shadow-sm'
                              : isBotMsg
                              ? 'bg-[#202738] text-[#F7F8FC] border border-[rgba(255,238,168,0.3)] shadow-xs'
                              : 'bg-[#283144] text-[#F7F8FC] border border-[rgba(255,255,255,0.1)] shadow-xs'
                          }`}
                        >
                          {msg.isEncrypted && !msg.isDecrypted && msg.text === '[Unable to decrypt message]' ? (
                            <span className="inline-flex flex-wrap items-center gap-1.5 text-[11px] opacity-85 italic">
                              <span>Encrypted with a previous device key</span>
                              <button
                                type="button"
                                onClick={() => setKeyModalOpen(true)}
                                className="underline text-[#FFEEA8] not-italic font-mono text-[10px] hover:opacity-80 cursor-pointer"
                              >
                                Restore key
                              </button>
                            </span>
                          ) : (
                            msg.text
                          )}
                        </div>
                        <span className="font-mono text-[9px] text-[#71809B] px-1 flex items-center gap-1">
                          {msg.isEncrypted && (
                            <span className="text-[#FFEEA8] inline-flex items-center" title="End-to-End Encrypted">
                              <Lock size={9} />
                            </span>
                          )}
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && !isBotMsg && (
                            msg.isSeen ? (
                              <CheckCheck size={12} className="text-[#FFEEA8]" title="Seen" />
                            ) : (
                              <Check size={12} className="text-[#71809B]" title="Sent" />
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Shimmer skeleton for bot response (no circular spinner per DESIGN.md) */}
                {botLoading && (
                  <div className="flex justify-start w-64">
                    <div className="p-3 rounded-xl bg-[#202738] border border-[rgba(255,255,255,0.1)] w-full space-y-2">
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
              <div className="shrink-0 p-2.5 sm:p-3.5 border-t border-[rgba(255,255,255,0.1)] bg-[#202738]">
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
                    onChange={handleMessageInputChange}
                    onBlur={() => emitTypingStatus(false)}
                    placeholder={activeChatUser.isBot ? "Ask SkillBot anything..." : "Write a message..."}
                    className="input-field text-xs sm:text-sm py-2 px-3 rounded-xl bg-[#171D2B]"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="btn btn-primary text-xs py-2 px-3 sm:px-4 rounded-xl shrink-0 disabled:opacity-40"
                  >
                    <Send size={14} />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center p-6 text-center text-[#A4B0C6]">
              Select a conversation to start chatting.
            </div>
          )}
        </div>
      </div>

      {/* In-Chat Schedule Modal */}
      {scheduleModalOpen && activeChatUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="z-[300] ui-card rounded-2xl max-w-md w-full p-6 bg-[#283144] border border-[rgba(255,255,255,0.15)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.1)]">
              <div>
                <span className="font-mono text-[10px] text-[#FFEEA8] uppercase font-semibold">Coordinate Session</span>
                <h3 className="heading-h2 text-base text-[#F7F8FC]">
                  Schedule with {activeChatUser.fullname?.firstname}
                </h3>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#171D2B] text-[#A4B0C6] hover:text-[#F7F8FC]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] text-[#A4B0C6] uppercase font-semibold block mb-1.5">Pick Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="input-field w-full py-2 px-3 text-xs rounded-xl bg-[#171D2B]"
                  required
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-[#A4B0C6] uppercase font-semibold block mb-1.5">Select Time Slot</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      onClick={() => setScheduleSlot(s.time)}
                      className={`p-2 rounded-xl text-center border text-xs font-semibold ${
                        scheduleSlot === s.time
                          ? 'bg-[#2B3F74] text-white border-[#FFEEA8]'
                          : 'bg-[#171D2B] text-[#A4B0C6] border-[rgba(255,255,255,0.08)]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] text-[#A4B0C6] uppercase font-semibold block mb-1.5">Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setScheduleDuration(mins)}
                      className={`p-2 rounded-xl text-center border text-xs font-semibold ${
                        scheduleDuration === mins
                          ? 'bg-[#2B3F74] text-white border-[#FFEEA8]'
                          : 'bg-[#171D2B] text-[#A4B0C6] border-[rgba(255,255,255,0.08)]'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="flex-1 btn btn-secondary text-xs py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="flex-1 btn btn-primary text-xs py-2 rounded-xl"
                >
                  {scheduling ? 'Scheduling...' : 'Confirm & Share'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E2EE Key Backup & Recovery Modal */}
      {keyModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="z-[300] ui-card rounded-2xl max-w-md w-full p-6 bg-[#283144] border border-[rgba(255,255,255,0.15)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.1)]">
              <div>
                <span className="font-mono text-[10px] text-[#FFEEA8] uppercase font-semibold">End-to-End Encryption</span>
                <h3 className="heading-h2 text-base text-[#F7F8FC]">
                  Encryption Key Backup
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setKeyModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#171D2B] text-[#A4B0C6] hover:text-[#F7F8FC]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#A4B0C6] leading-relaxed">
              Encryption keys now sync automatically whenever you sign in with your password. If you stayed signed in from an older session or switched ports, enter your account password below to unlock or back up your keys immediately.
            </p>

            <form onSubmit={handlePasswordVaultSync} className="space-y-2.5 p-3.5 rounded-xl bg-[#171D2B] border border-[rgba(255,238,168,0.2)]">
              <label className="font-mono text-[10px] text-[#FFEEA8] uppercase font-semibold block">
                {currentUser?.encryptedKeyBackup ? 'Unlock Synced Key Vault' : 'Enable Auto-Sync Vault'}
              </label>
              <input
                type="password"
                value={vaultPassword}
                onChange={(e) => setVaultPassword(e.target.value)}
                placeholder="Enter your SkillSwap account password"
                required
                className="input-field w-full py-2 px-3 text-xs rounded-xl bg-[#202738]"
              />
              <button
                type="submit"
                disabled={syncingVault || !vaultPassword}
                className="w-full btn btn-primary text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <KeyRound size={14} />
                <span>
                  {syncingVault
                    ? 'Syncing...'
                    : currentUser?.encryptedKeyBackup
                    ? 'Unlock & Decrypt Messages'
                    : 'Save Encrypted Key Vault'}
                </span>
              </button>
            </form>

            <details className="pt-2 border-t border-[rgba(255,255,255,0.08)] text-xs text-[#A4B0C6]">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider hover:text-[#FFEEA8] select-none">
                Advanced: Manual JSON Backup
              </summary>
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleExportKeys}
                    className="flex-1 btn btn-secondary text-xs py-2 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>Download Backup</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyKeyBackup}
                    className="flex-1 btn btn-secondary text-xs py-2 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <KeyRound size={14} />
                    <span>Copy JSON</span>
                  </button>
                </div>

                <form onSubmit={handleImportKeys} className="space-y-2">
                  <textarea
                    rows={3}
                    value={backupInput}
                    onChange={(e) => setBackupInput(e.target.value)}
                    placeholder='Paste your exported {"version":1,"privateJwk":...} backup here'
                    className="input-field w-full p-2.5 text-[11px] font-mono rounded-xl bg-[#171D2B]"
                  />
                  <button
                    type="submit"
                    disabled={importingKeys || !backupInput.trim()}
                    className="w-full btn btn-secondary text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Upload size={14} />
                    <span>{importingKeys ? 'Restoring...' : 'Restore From JSON'}</span>
                  </button>
                </form>
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messaging;
