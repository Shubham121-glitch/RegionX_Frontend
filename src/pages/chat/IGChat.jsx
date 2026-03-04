import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import io from 'socket.io-client';
import MessageBubble from '../../components/chat/MessageBubble';
import TypingIndicator from '../../components/chat/TypingIndicator';
import SeenIndicator from '../../components/chat/SeenIndicator';
import Loading from '../../components/loading/Loading';
import { FiArrowLeft, FiSend, FiPhone, FiVideo, FiInfo } from 'react-icons/fi';
import './igChat.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const BASE_URL = API_URL.replace(/\/api\/?$/, '') || 'http://localhost:5000';

function IGChat() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();

  // State for chat list
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // State for active chat
  const [selectedChatId, setSelectedChatId] = useState(businessId || null);
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

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Redirect if not signed in
  useEffect(() => {
    if (!isSignedIn) {
      navigate('/sign-in');
    }
  }, [isSignedIn, navigate]);

  // Fetch all chats
  useEffect(() => {
    if (!user?.id) return;
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const fetchChats = async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(`${API_URL}/chat/list/${user?.id}`, {
        params: { page: 1, limit: 50 },
      });
      setChats(response.data.chats || []);
      setListError(null);
    } catch (err) {
      console.error('❌ Error fetching chats:', err);
      const isNetworkError = err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      setListError(
        isNetworkError
          ? 'Cannot connect to server. Make sure the backend is running (e.g. npm run dev in the backend folder).'
          : err.response?.data?.message || 'Failed to load chats'
      );
    }
  };

  // Filter chats
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredChats(
        chats.filter(
          (chat) =>
            chat.businessName?.toLowerCase().includes(query) ||
            chat.lastMessage?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, chats]);

  // Fetch and load selected chat
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
      const response = await axios.get(`${API_URL}/chat/${selectedChatId}`, {
        params: { userId: user?.id },
      });

      const chatData = response.data?.chat || response.data;
      setChat(chatData);
      setMessages(response.data?.messages ?? chatData?.messages ?? []);
      setBusiness(response.data?.business ?? null);

      // Mark as seen
      if (user?.id && chatData?._id) {
        try {
          await axios.put(`${API_URL}/chat/seen`, {
            chatId: chatData._id,
            userId: user.id,
          });
        } catch (seenErr) {
          console.warn('⚠️ Mark as seen failed:', seenErr.message);
        }
      }
    } catch (err) {
      console.error('❌ Error loading chat:', err);
      setError('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  // Initialize socket
  useEffect(() => {
    if (!user?.id || !selectedChatId) return;

    const socketInstance = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      const sid = socketInstance.id;
      console.log('✅ Socket connected:', sid);
      socketInstance.emit('register_user', {
        userId: user.id,
        userType: 'user',
      });
      // Join room when socket connects (chat may already be loaded)
      const roomId = chat?._id != null ? String(chat._id) : null;
      if (roomId) {
        socketInstance.emit('join_chat', {
          chatId: roomId,
          userId: user.id,
          userType: 'user',
        });
        console.log('📤 join_chat emitted, room:', roomId);
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected:', reason);
    });

    socketInstance.on('receive_message', (data) => {
      setMessages((prev) => {
        const exists = prev?.some((msg) => msg._id === data._id);
        if (exists) return prev;
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

    socketInstance.on('user_typing', (data) => {
      if (data.chatId === chat._id && data.userId !== user.id) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    });

    socketInstance.on('user_online', (data) => {
      if (data.userId === selectedChatId) {
        setIsBusinessOnline(true);
      }
    });

    socketInstance.on('user_offline', (data) => {
      if (data.userId === selectedChatId) {
        setIsBusinessOnline(false);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(socketInstance);

    return () => {
      if (chat?._id) {
        socketInstance.emit('leave_chat', {
          chatId: String(chat._id),
          userId: user.id,
          userType: 'user',
        });
      }
      socketInstance.disconnect();
    };
  }, [user?.id, selectedChatId, chat?._id]);

  // Join room when chat loads after socket is already connected (handles race)
  useEffect(() => {
    if (!socket?.connected || !chat?._id || !user?.id) return;
    const roomId = String(chat._id);
    socket.emit('join_chat', {
      chatId: roomId,
      userId: user.id,
      userType: 'user',
    });
    console.log('📤 join_chat emitted (chat ready), room:', roomId);
  }, [socket, chat?._id, user?.id]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSendMessage = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!inputValue.trim() || !chat?._id || isSending) return;

      const messageText = inputValue;
      setInputValue('');
      setIsSending(true);

      try {
        const payload = {
          chatId: chat._id,
          senderId: user.id,
          senderType: 'user',
          receiverId: selectedChatId || business?._id,
          message: messageText,
        };
        
        console.log('📨 Sending message:', payload);
        
        const response = await axios.post(
          `${API_URL}/chat/send`,
          payload
        );

        console.log('✅ Message sent response:', response.data);
        
        const newMessage = response.data?.data || response.data?.message;
        if (newMessage) {
          setMessages((prev) => [...prev, newMessage]);
          setError(null); // Clear any previous errors
        }

        if (socket?.connected) {
          const roomId = String(chat._id);
          socket.emit('send_message', {
            chatId: roomId,
            senderId: user.id,
            senderType: 'user',
            message: messageText,
            timestamp: new Date(),
          });
          socket.emit('stop_typing', {
            chatId: roomId,
            userId: user.id,
            userType: 'user',
          });
        }

        // Refresh chat list
        fetchChats();
      } catch (err) {
        console.error('❌ Error sending message:', err);
        console.error('Error response:', err?.response?.data);
        setInputValue(messageText);
        setError('Failed to send message. Please try again.');
      } finally {
        setIsSending(false);
      }
    },
    [inputValue, chat?._id, user?.id, socket, isSending]
  );

  // Handle typing
  const handleTyping = useCallback(() => {
    if (!socket?.connected || !chat?._id) return;
    const roomId = String(chat._id);
    socket.emit('typing', {
      chatId: roomId,
      userId: user.id,
      userType: 'user',
    });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', {
        chatId: roomId,
        userId: user.id,
        userType: 'user',
      });
    }, 1000);
  }, [socket, chat?._id, user?.id]);

  const handleChatSelect = (businessId) => {
    setSelectedChatId(businessId);
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
    navigate('/chat');
  };

  // Get business avatar URL (backend uses profileImage path)
  const getBusinessAvatar = (business) => {
    const path = business?.profileImage;
    if (path && typeof path === 'string') {
      return path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    }
    const initial = business?.businessTitle?.[0] || '?';
    return `https://via.placeholder.com/56?text=${encodeURIComponent(initial)}`;
  };

  const getChatItemAvatar = (chatItem) => {
    const path = chatItem?.businessImage || chatItem?.businessLogo;
    if (path && typeof path === 'string') {
      return path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    }
    const initial = chatItem?.businessName?.[0] || '?';
    return `https://via.placeholder.com/56?text=${encodeURIComponent(initial)}`;
  };

  return (
    <div className="ig-chat-container">
      {/* Chat List Sidebar */}
      <div className="ig-chat-sidebar">
        <div className="sidebar-header">
          <h1>Messages</h1>
          <div className="sidebar-icons">
            <button className="icon-btn" title="New message">
              ✎
            </button>
          </div>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-ig"
          />
        </div>

        <div className="chat-list-ig">
          {listError ? (
            <div className="empty-state" style={{ padding: '1rem', color: '#c53030' }}>
              <p>{listError}</p>
            </div>
          ) : !Array.isArray(filteredChats) || filteredChats.length === 0 ? (
            <div className="empty-state">
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredChats.map((chatItem) => (
              <div
                key={chatItem?._id}
                className={`chat-list-item-ig ${
                  selectedChatId === chatItem?.businessId ? 'active' : ''
                }`}
                onClick={() => handleChatSelect(chatItem?.businessId)}
              >
                <div className="chat-avatar">
                  <img
                    src={getChatItemAvatar(chatItem)}
                    alt={chatItem?.businessName || 'Chat'}
                    onError={(e) => { e.target.src = `https://via.placeholder.com/56?text=${encodeURIComponent(chatItem?.businessName?.[0] || '?')}`; }}
                  />
                  {chatItem?.isOnline && <div className="online-indicator"></div>}
                </div>

                <div className="chat-info">
                  <div className="chat-header-row">
                    <h3>{chatItem?.businessName || 'Unknown'}</h3>
                    <span className="timestamp">
                      {chatItem?.lastMessageTime
                        ? new Date(chatItem.lastMessageTime).toLocaleDateString()
                        : ''}
                    </span>
                  </div>
                  <p className="last-message">
                    {chatItem?.lastMessage ? chatItem.lastMessage.substring(0, 50) : 'No messages yet'}
                    {chatItem?.lastMessage && chatItem.lastMessage.length > 50 ? '...' : ''}
                  </p>
                </div>

                {chatItem?.unreadCount > 0 && (
                  <div className="unread-badge-ig">{chatItem.unreadCount}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedChatId ? (
        <div className="ig-chat-main">
          {/* Chat Header */}
          <div className="ig-chat-header">
            <div className="header-left">
              <button className="back-btn-ig" onClick={handleBackToList}>
                <FiArrowLeft />
              </button>
              <div className="header-info">
                <img
                  src={getBusinessAvatar(business)}
                  alt={business?.businessTitle || 'Business'}
                  className="header-avatar"
                  onError={(e) => { e.target.src = `https://via.placeholder.com/56?text=${encodeURIComponent(business?.businessTitle?.[0] || '?')}`; }}
                />
                <div className="header-text">
                  <h2>{business?.businessTitle || 'Business'}</h2>
                  <p className="status">
                    {isBusinessOnline ? (
                      <span className="online">Active now</span>
                    ) : (
                      <span>Offline</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="header-actions">
              <button className="action-btn" title="Call">
                <FiPhone />
              </button>
              <button className="action-btn" title="Video call">
                <FiVideo />
              </button>
              <button className="action-btn" title="Info">
                <FiInfo />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {loading ? (
            <div className="messages-loading">
              <Loading />
            </div>
          ) : error ? (
            <div className="messages-error">
              <p>{error}</p>
            </div>
          ) : (
            <div className="ig-messages">
              {messages.length === 0 ? (
                <div className="messages-empty">
                  <div className="empty-avatar">
                    <img
                      src={getBusinessAvatar(business)}
                      alt={business?.name}
                    />
                  </div>
                  <h3>{business?.name}</h3>
                  <p>Start a conversation</p>
                </div>
              ) : (
                <>
                  {Array.isArray(messages) && messages.length > 0 ? (
                    messages.map((msg, index) => (
                      <div key={msg?._id || `msg-${index}`} className="message-group">
                        <MessageBubble
                          message={msg}
                          isOwn={msg?.senderId === user?.id}
                        />
                        {msg?.senderId === user?.id && index === messages.length - 1 && (
                          <SeenIndicator seen={msg?.seen} />
                        )}
                      </div>
                    ))
                  ) : null}
                  {isTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="ig-input-area">
            <form onSubmit={handleSendMessage} className="message-form">
              <input
                ref={inputRef}
                type="text"
                placeholder="Aa"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onInput={handleTyping}
                disabled={isSending || loading}
                className="message-input-ig"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isSending || loading}
                className="send-btn-ig"
              >
                <FiSend />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="ig-chat-empty">
          <div className="empty-illustration">
            <div className="empty-icon">💬</div>
            <h2>Your Messages</h2>
            <p>Send private messages and get updates from your contacts</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default IGChat;
