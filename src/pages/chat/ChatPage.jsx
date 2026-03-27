import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { FiSend, FiArrowLeft, FiCamera, FiInfo, FiPhone, FiVideo, FiPlusCircle, FiHeart, FiSearch, FiEdit } from 'react-icons/fi';
import { io } from 'socket.io-client';
import Loading from '../../components/loading/Loading';
import MessageBubble from '../../components/chat/MessageBubble';
import TypingIndicator from '../../components/chat/TypingIndicator';
import SeenIndicator from '../../components/chat/SeenIndicator';
import './chatPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

function ChatPage() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();

  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState(businessId || null);
  useEffect(() => {
    if (businessId) setSelectedChatId(businessId);
  }, [businessId]);
  const [messages, setMessages] = useState([]);
  const [business, setBusiness] = useState(null);
  const [chat, setChat] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listError, setListError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isBusinessOnline, setIsBusinessOnline] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isSignedIn) navigate('/sign-in');
  }, [isSignedIn, navigate]);

  const fetchChats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API_URL}/chat/list/${user.id}`, {
        params: { page: 1, limit: 50 },
      });
      setChats(res.data.chats || []);
      setListError(null);
    } catch (err) {
      console.error('Error fetching chats:', err);
      const isNetwork = err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      setListError(
        isNetwork
          ? 'Cannot connect to server. Make sure the backend is running.'
          : err.response?.data?.message || 'Failed to load chats'
      );
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [user?.id, fetchChats]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredChats(
        chats.filter(
          (c) =>
            c.businessName?.toLowerCase().includes(q) ||
            c.lastMessage?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, chats]);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      setBusiness(null);
      setChat(null);
      setLoading(false);
      return;
    }
    loadChatData();
  }, [selectedChatId]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If selectedChatId looks like an ObjectId (24 chars), use the ID route
      // Otherwise use the businessId route
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(selectedChatId);
      const url = isObjectId 
        ? `${API_URL}/chat/id/${selectedChatId}` 
        : `${API_URL}/chat/${selectedChatId}`;
        
      const res = await axios.get(url, {
        params: { userId: user?.id },
      });
      
      const chatData = res.data?.chat || res.data;
      setChat(chatData);
      setMessages(res.data?.messages ?? chatData?.messages ?? []);
      setBusiness(res.data?.business ?? null);
      
      if (user?.id && chatData?._id) {
        try {
          await axios.put(`${API_URL}/chat/seen`, {
            chatId: chatData._id,
            userId: user.id,
          });
        } catch (_) {}
      }
    } catch (err) {
      console.error('Error loading chat:', err);
      setError('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id || !selectedChatId) return;
    const s = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });
    s.on('connect', () => {
      // Determine if we are acting as user or business based on chat data
      const isOwner = chat?.businessId && chats.some(c => c._id === chat._id && c.isOwner);
      const userType = isOwner ? 'business' : 'user';
      
      s.emit('register_user', { userId: user.id, userType });
      const roomId = chat?._id != null ? String(chat._id) : null;
      if (roomId) {
        s.emit('join_chat', { chatId: roomId, userId: user.id, userType });
      }
    });
    s.on('connect_error', (err) => console.error('Socket error:', err));
    s.on('receive_message', (data) => {
      setMessages((prev) => {
        if (prev?.some((m) => m._id === data._id)) return prev;
        return [
          ...(prev || []),
          {
            _id: data._id || `temp-${Date.now()}`,
            chatId: data.chatId,
            senderId: data.senderId,
            senderType: data.senderType,
            message: data.message,
            seen: data.seen || false,
            createdAt: data.createdAt || data.timestamp,
            seenAt: data.seenAt,
          },
        ];
      });
    });
    s.on('user_typing', (data) => {
      if (String(data?.chatId) === String(chat?._id) && data.userId !== user.id) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    });
    s.on('user_connected', (data) => {
      if (data.userType === 'business') setIsBusinessOnline(true);
    });
    s.on('user_disconnected', (data) => {
      if (data.userType === 'business') setIsBusinessOnline(false);
    });
    setSocket(s);
    return () => {
      if (chat?._id) {
        s.emit('leave_chat', {
          chatId: String(chat._id),
          userId: user.id,
          userType: 'user',
        });
      }
      s.disconnect();
    };
  }, [user?.id, selectedChatId, chat?._id]);

  useEffect(() => {
    if (!socket?.connected || !chat?._id || !user?.id) return;
    const roomId = String(chat._id);
    socket.emit('join_chat', { chatId: roomId, userId: user.id, userType: 'user' });
  }, [socket, chat?._id, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!inputValue.trim() || !chat?._id || isSending) return;
      const messageText = inputValue;
      setInputValue('');
      setIsSending(true);
      try {
        const isOwner = chat?.businessId && chats.some(c => c._id === chat._id && c.isOwner);
        const userType = isOwner ? 'business' : 'user';
        
        const payload = {
          chatId: chat._id,
          senderId: user.id,
          senderType: userType,
          receiverId: isOwner ? chat.userId : (selectedChatId || business?._id),
          message: messageText,
        };
        const res = await axios.post(`${API_URL}/chat/send`, payload);
        const newMessage = res.data?.data || res.data?.message;
        if (newMessage) {
          setMessages((prev) => [...prev, newMessage]);
          setError(null);
        }
        if (socket?.connected) {
          const roomId = String(chat._id);
          socket.emit('send_message', {
            chatId: roomId,
            senderId: user.id,
            senderType: userType,
            message: messageText,
            timestamp: new Date(),
          });
          socket.emit('stop_typing', {
            chatId: roomId,
            userId: user.id,
            userType: userType,
          });
        }
        fetchChats();
      } catch (err) {
        console.error('Error sending message:', err);
        setInputValue(messageText);
        setError('Failed to send message. Please try again.');
      } finally {
        setIsSending(false);
      }
    },
    [inputValue, chat?._id, user?.id, socket, isSending, business?._id, selectedChatId, fetchChats]
  );

  const handleTyping = useCallback(() => {
    if (!socket?.connected || !chat?._id) return;
    const roomId = String(chat._id);
    socket.emit('typing', { chatId: roomId, userId: user.id, userType: 'user' });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { chatId: roomId, userId: user.id, userType: 'user' });
    }, 1000);
  }, [socket, chat?._id, user?.id]);

  const getBusinessAvatar = (b) => {
    const path = b?.profileImage;
    if (path && typeof path === 'string')
      return path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(b?.businessTitle || '?')}&background=2d3748&color=fff`;
  };

  const getChatItemAvatar = (item) => {
    const path = item?.businessImage || item?.businessLogo;
    if (path && typeof path === 'string')
      return path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.businessName || '?')}&background=2d3748&color=fff`;
  };

  const formatListTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    if (now - d < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (!isSignedIn) return null;

  return (
    <>
      <div className="chat-page-container">
        <div className="chat-page">
        <aside className={`chat-sidebar ${selectedChatId ? 'chat-sidebar-hidden' : ''}`}>
          <div className="chat-sidebar-header">
            <div className="chat-sidebar-title-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  type="button" 
                  className="chat-back-btn" 
                  onClick={() => navigate(-1)}
                  title="Back"
                >
                  <FiArrowLeft />
                </button>
                <h1 className="chat-sidebar-title">{user?.fullName || user?.username || 'Messages'}</h1>
              </div>
              <FiEdit style={{ fontSize: '1.2rem', cursor: 'pointer' }} />
            </div>
          </div>
          <div className="chat-search-wrap">
            <div className="chat-search-container" style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ig-text-grey)' }} />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="chat-search-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>
          <div className="chat-list-wrap">
            {listError ? (
              <div className="chat-list-error">{listError}</div>
            ) : !Array.isArray(filteredChats) || filteredChats.length === 0 ? (
              <div className="chat-list-empty">
                <p>No conversations yet</p>
                <span className="chat-list-empty-hint">Start a chat from a business profile</span>
              </div>
            ) : (
              filteredChats.map((item) => (
                <button
                  type="button"
                  key={item?._id}
                  className={`chat-list-item ${selectedChatId === (item?._id || item?.businessId) ? 'chat-list-item-active' : ''}`}
                  onClick={() => {
                    setSelectedChatId(item?._id || item?.businessId);
                    setError(null);
                  }}
                >
                  <div className="chat-list-avatar">
                    <img
                      src={getChatItemAvatar(item)}
                      alt=""
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.businessName?.[0] || '?')}`;
                      }}
                    />
                  </div>
                  <div className="chat-list-body">
                    <span className="chat-list-name">{item?.businessName || 'Unknown'}</span>
                    <div className="chat-list-row">
                      <p className="chat-list-preview" style={{ fontWeight: item?.unreadCount > 0 ? '600' : '400', color: item?.unreadCount > 0 ? 'var(--textP)' : 'var(--ig-text-grey)' }}>
                        {item?.lastMessage ? item.lastMessage : 'Started a conversation'}
                      </p>
                      <span className="chat-list-dot">•</span>
                      <span className="chat-list-time">{formatListTime(item?.lastMessageTime)}</span>
                    </div>
                  </div>
                  {item?.unreadCount > 0 && (
                    <div style={{ width: '8px', height: '8px', background: '#0095f6', borderRadius: '50%' }} />
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        <section className={`chat-main ${selectedChatId ? 'chat-main-visible' : ''}`}>
          {!selectedChatId ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon" style={{ width: '96px', height: '96px', border: '2px solid var(--textP)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: '1.5rem' }}>
                <FiSend />
              </div>
              <h2>Your messages</h2>
              <p>Send private photos and messages to a friend or group</p>
              <button 
                className="chat-send-btn" 
                style={{ background: '#0095f6', color: 'white', padding: '8px 16px', borderRadius: '8px', marginTop: '1rem', width: 'auto', height: 'auto' }}
                onClick={() => navigate('/businesses')}
              >
                Send message
              </button>
            </div>
          ) : (
            <>
              <header className="chat-thread-header">
                <button
                  type="button"
                  className="chat-thread-back"
                  onClick={() => { setSelectedChatId(null); navigate('/chat'); }}
                  aria-label="Back to list"
                >
                  <FiArrowLeft />
                </button>
                <div className="chat-thread-avatar">
                  <img
                    src={getBusinessAvatar(business)}
                    alt=""
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(business?.businessTitle?.[0] || '?')}`;
                    }}
                  />
                </div>
                <div className="chat-thread-info">
                  <h2 className="chat-thread-name">{business?.businessTitle || 'Business'}</h2>
                  <p className="chat-thread-status">
                    {isBusinessOnline ? 'Active now' : 'Offline'}
                  </p>
                </div>
                <div className="chat-thread-actions">
                  {/* Icons removed as per user request */}
                </div>
              </header>

              <div className="chat-messages-wrap">
                {loading ? (
                  <div className="chat-messages-loading">
                    <Loading />
                  </div>
                ) : error ? (
                  <div className="chat-messages-error">{error}</div>
                ) : (
                  <div className="chat-messages">
                    {messages.length === 0 ? (
                      <div className="chat-messages-empty">
                        <div className="chat-empty-avatar">
                          <img src={getBusinessAvatar(business)} alt="" />
                        </div>
                        <h3>{business?.businessTitle || 'Business'}</h3>
                        <p>Send a message to start the conversation</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg, i) => (
                          <div key={msg?._id || `m-${i}`} className="chat-message-group">
                            <MessageBubble
                              message={msg}
                              isOwn={msg?.senderId === user?.id}
                              userType={msg?.senderType}
                            />
                          </div>
                        ))}
                        {isTyping && (
                          <div className="chat-typing-wrap">
                            <TypingIndicator />
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="chat-input-container">
                <form onSubmit={handleSendMessage} className="chat-input-wrap">
                  <div className="chat-input-icons-left">
                    <FiPlusCircle style={{ cursor: 'pointer' }} title="Add attachment" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onInput={handleTyping}
                    disabled={isSending || loading}
                    className="chat-input"
                  />
                  {inputValue.trim() ? (
                    <button
                      type="submit"
                      disabled={isSending || loading}
                      className="chat-send-btn"
                    >
                      Send
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px', fontSize: '1.4rem', color: 'var(--textP)' }}>
                      <FiCamera style={{ cursor: 'pointer' }} />
                    </div>
                  )}
                </form>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
    </>
  );
}

export default ChatPage;