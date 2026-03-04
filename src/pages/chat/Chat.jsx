import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import io from 'socket.io-client';
import MessageBubble from '../../components/chat/MessageBubble';
import TypingIndicator from '../../components/chat/TypingIndicator';
import SeenIndicator from '../../components/chat/SeenIndicator';
import Loading from '../../components/loading/Loading';
import { FiArrowLeft, FiSend, FiPhone, FiMail } from 'react-icons/fi';
import './chat.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

function Chat() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();

  // State
  const [messages, setMessages] = useState([]);
  const [business, setBusiness] = useState(null);
  const [chat, setChat] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Initialize socket connection
  useEffect(() => {
    if (!user?.id || !businessId || businessId === undefined) return;

    const socketInstance = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      const sid = socketInstance.id;
      console.log('✅ Socket connected:', sid);
      socketInstance.emit('register_user', {
        userId: user.id,
        userType: 'user',
      });
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

    // Add error listener for socket connection
    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setError('Failed to connect to chat service. Some features may not work properly.');
    });

    // Listen for incoming messages
    socketInstance.on('receive_message', (data) => {
      console.log('📩 Received message:', data);
      
      setMessages((prev) => {
        // Prevent duplicate messages
        const exists = prev.some((msg) => msg._id === data._id);
        if (exists) return prev;

        return [
          ...prev,
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

    // Listen for typing indicator
    socketInstance.on('user_typing', (data) => {
      console.log('✍️ User typing:', data);
      setIsTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    });

    // Listen for stop typing
    socketInstance.on('user_stop_typing', () => {
      setIsTyping(false);
    });

    // Listen for user connected
    socketInstance.on('user_connected', (data) => {
      console.log('🟢 User connected:', data);
      if (data.userType === 'business') {
        setIsBusinessOnline(true);
      }
    });

    // Listen for user disconnected
    socketInstance.on('user_disconnected', (data) => {
      console.log('🔴 User disconnected:', data);
      if (data.userType === 'business') {
        setIsBusinessOnline(false);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsBusinessOnline(false);
    });

    socketInstance.on('error', (error) => {
      console.error('⚠️ Socket error:', error);
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
  }, [user?.id, businessId, chat?._id]);

  // Join room when chat loads after socket is already connected
  useEffect(() => {
    if (!socket?.connected || !chat?._id || !user?.id) return;
    const roomId = String(chat._id);
    socket.emit('join_chat', { chatId: roomId, userId: user.id, userType: 'user' });
    console.log('📤 join_chat emitted (chat ready), room:', roomId);
  }, [socket, chat?._id, user?.id]);

  // Fetch chat and messages
  useEffect(() => {
    const fetchChatData = async () => {
      if (!user?.id || !businessId || businessId === undefined) return;

      try {
        setLoading(true);
        setError(null);

        // Validate businessId format first
        if (!/^[0-9a-fA-F]{24}$/.test(businessId)) {
          throw new Error('Invalid business ID format');
        }

        // Fetch business info
        try {
          const businessRes = await axios.get(
            `${API_URL}/business/${businessId}`
          );
          setBusiness(businessRes.data);
        } catch (businessError) {
          console.error('❌ Business fetch error:', businessError);
          // Don't throw error immediately - try to get chat anyway
          if (businessError.response?.status === 404) {
            console.warn('Business not found, but will attempt to create/get chat...');
          } else {
            console.warn('Non-404 error fetching business, continuing with chat creation...');
          }
          // Continue to fetch or create chat even if business fetch fails
        }

        // Fetch or create chat
        const chatRes = await axios.get(`${API_URL}/chat/${businessId}`, {
          params: { userId: user.id },
        });

        if (!chatRes.data.success) {
          throw new Error(chatRes.data.message || 'Failed to get chat');
        }

        setChat(chatRes.data.chat);
        setMessages(chatRes.data.messages || []);
        
        // If business is still null and chat was created, set a fallback business name
        if (!business && chatRes.data.business) {
          setBusiness(chatRes.data.business);
        } else if (!business && chatRes.data.chat) {
          // Set a fallback if business info is unavailable
          setBusiness({
            businessTitle: 'Business',
            _id: businessId,
          });
        }
      } catch (err) {
        console.error('❌ Error fetching chat:', err);
        
        // More specific error handling
        let errorMessage = 'Failed to load chat. Please try again.';
        if (err.response?.status === 404) {
          errorMessage = 'Business not found. The business may have been removed.';
        } else if (err.response?.status === 400) {
          errorMessage = 'Invalid business ID format.';
        } else if (err.message?.includes('Network Error')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [user?.id, businessId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as seen
  useEffect(() => {
    if (!chat?._id) return;

    const timeout = setTimeout(async () => {
      try {
        const response = await axios.put(`${API_URL}/chat/seen`, {
          chatId: chat._id,
          userId: user.id,
        });

        if (response.data.success) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.senderType === 'business' && !msg.seen
                ? { ...msg, seen: true, seenAt: new Date() }
                : msg
            )
          );
        }
      } catch (err) {
        console.error('Error marking messages as seen:', err);
        // Don't throw error - this is not critical for chat functionality
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [messages, chat?._id, user?.id]);

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    const messageText = inputValue.trim();
    if (!messageText || !chat?._id || isSending) return;

    setIsSending(true);
    setInputValue('');

    try {
      // Save message to database
      const response = await axios.post(`${API_URL}/chat/send`, {
        chatId: chat._id,
        senderId: user.id,
        senderType: 'user',
        receiverId: business?.userId,
        message: messageText,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to send message');
      }

      const newMessage = response.data.data;

      // Add to local state
      setMessages((prev) => [...prev, newMessage]);

      if (socket?.connected) {
        const roomId = String(chat._id);
        socket.emit('send_message', {
          chatId: roomId,
          senderId: user.id,
          senderType: 'user',
          message: messageText,
          _id: newMessage._id,
          createdAt: newMessage.createdAt,
        });
        socket.emit('stop_typing', {
          chatId: roomId,
          userId: user.id,
          userType: 'user',
        });
      }
    } catch (err) {
      console.error('❌ Error sending message:', err);
      setError('Failed to send message. Try again.');
      setInputValue(messageText);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setInputValue(e.target.value);

    if (!socket?.connected || !chat?._id) return;

    socket.emit('typing', {
      chatId: String(chat._id),
      userId: user.id,
      userType: 'user',
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', {
        chatId: String(chat._id),
        userId: user.id,
        userType: 'user',
      });
    }, 1500);
  };

  if (!isSignedIn) {
    return null;
  }

  if (loading) {
    return <Loading />;
  }

  if (error && !messages.length) {
    return (
      <div className="chat-error-container">
        <div className="error-content">
          <h3>💬 Chat Error</h3>
          <p>{error}</p>
          <div className="error-details">
            <p><strong>Business ID:</strong> {businessId}</p>
            <p><strong>User ID:</strong> {user?.id || 'Not available'}</p>
          </div>
          <div className="error-actions">
            <button 
              onClick={() => navigate('/chats')} 
              className="back-btn"
            >
              Back to Chats
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-btn"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* Chat Header */}
      <div className="chat-header">
        <button
          className="chat-back-btn"
          onClick={() => navigate('/chats')}
          title="Back to chats"
        >
          <FiArrowLeft />
        </button>

        <div className="chat-header-info">
          <div className="business-header">
            <h2 className="chat-title">{business?.businessTitle}</h2>
            <span
              className={`online-indicator ${
                isBusinessOnline ? 'online' : 'offline'
              }`}
              title={isBusinessOnline ? 'Online' : 'Offline'}
            >
              {isBusinessOnline ? '🟢 Online' : '🔵 Offline'}
            </span>
          </div>
        </div>

        <div className="chat-header-actions">
          {business?.contactInfo?.phone && (
            <button
              className="chat-action-btn"
              onClick={() =>
                window.location.href = `tel:${business.contactInfo.phone}`
              }
              title="Call business"
            >
              <FiPhone />
            </button>
          )}
          {business?.contactInfo?.email && (
            <button
              className="chat-action-btn"
              onClick={() =>
                window.location.href = `mailto:${business.contactInfo.email}`
              }
              title="Email business"
            >
              <FiMail />
            </button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="empty-icon">💬</div>
            <p>Start a conversation with {business?.businessTitle}</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg._id} className="message-wrapper">
                <MessageBubble
                  message={msg}
                  isOwn={msg.senderId === user.id}
                  userType={msg.senderType}
                />
                {msg.senderId === user.id && (
                  <SeenIndicator seen={msg.seen} seenAt={msg.seenAt} />
                )}
              </div>
            ))}

            {isTyping && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Banner */}
      {error && messages.length > 0 && (
        <div className="chat-error-banner">⚠️ {error}</div>
      )}

      {/* Input Box */}
      <form className="chat-input-box" onSubmit={handleSendMessage}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="chat-input"
          disabled={isSending}
        />
        <button
          type="submit"
          className={`chat-send-btn ${isSending ? 'sending' : ''}`}
          disabled={!inputValue.trim() || isSending}
          title="Send message"
        >
          {isSending ? '⏳' : <FiSend />}
        </button>
      </form>
    </div>
  );
}

export default Chat;
