import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import './chatList.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ChatList() {
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();

  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/sign-in');
      return;
    }

    fetchChats();
    const interval = setInterval(fetchChats, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [isSignedIn]);

  // Filter chats based on search query
  useEffect(() => {
    if (!searchQuery?.trim()) {
      setFilteredChats(chats);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = chats.filter(
        (chat) =>
          (chat.businessName && chat.businessName.toLowerCase().includes(query)) ||
          (chat.lastMessage && chat.lastMessage.toLowerCase().includes(query))
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats]);

  const fetchChats = async () => {
    try {
      console.log('📡 Fetching chats for userId:', user?.id);
      
      // Check if user ID is available
      if (!user?.id) {
        throw new Error('User ID not available');
      }
      
      const response = await axios.get(`${API_URL}/chat/list/${user.id}`, {
        params: { page: 1, limit: 50 },
      });

      console.log('✅ Chats fetched:', response.data.chats);
      setChats(response.data.chats || []);

      // Calculate total unread
      const unread = response.data.chats.reduce(
        (sum, chat) => sum + (chat.unreadCount || 0),
        0
      );
      setTotalUnread(unread);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching chats:', err);
      
      // More specific error handling
      let errorMessage = 'Failed to load chats';
      if (err.message?.includes('User ID not available')) {
        errorMessage = 'Please sign in to view your chats.';
      } else if (err.response?.status === 404) {
        errorMessage = 'User not found.';
      } else if (err.message?.includes('Network Error')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (businessId) => {
    console.log('🎯 Opening chat for businessId:', businessId);
    navigate(`/chat/${businessId}`);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return 'No messages yet';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  if (!isSignedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="chat-list-page">
        <div className="chat-list-skeleton">
          <div className="skeleton-header"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-item"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-list-page">
      {/* Header */}
      <div className="chat-list-header">
        <h1 className="chat-list-title">💬 Your Conversations</h1>
        {totalUnread > 0 && (
          <span className="total-unread-badge">{totalUnread}</span>
        )}
      </div>

      {/* Search Bar */}
      <div className="chat-list-search">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          autoFocus
        />
      </div>

      {/* Chat List */}
      <div className="chat-list-container">
        {error && (
          <div className="chat-list-error">
            <p>⚠️ {error}</p>
            <button onClick={fetchChats} className="retry-btn">
              Retry
            </button>
          </div>
        )}

        {!error && filteredChats.length === 0 && (
          <div className="chat-list-empty">
            <div className="empty-icon">💭</div>
            <h3>No conversations yet</h3>
            <p>Start chatting with businesses to see them here!</p>
            <button
              onClick={() => navigate('/services')}
              className="browse-businesses-btn"
            >
              Browse Businesses
            </button>
          </div>
        )}

        {!error && filteredChats.length > 0 && (
          <div className="chats-list">
            {filteredChats.map((chat) => (
              <div
                key={chat._id || chat.businessId}
                className="chat-item chat-card"
                onClick={() => handleChatClick(chat.businessId)}
              >
                {/* Business Avatar */}
                <div className="chat-avatar-container">
                  {chat.businessLogo ? (
                    <img
                      src={`${API_URL.split('/api')[0]}${chat.businessLogo}`}
                      alt={chat.businessName}
                      className="chat-avatar"
                    />
                  ) : (
                    <div className="chat-avatar-placeholder">
                      {chat.businessName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {chat.unreadCount > 0 && (
                    <span className="unread-dot"></span>
                  )}
                </div>

                {/* Chat Info */}
                <div className="chat-info">
                  <div className="chat-header-row">
                    <h4 className="chat-name">{chat.businessName}</h4>
                    <span className="chat-time">
                      {formatTime(chat.lastMessageTime)}
                    </span>
                  </div>
                  <p className="chat-preview">
                    {truncateMessage(chat.lastMessage)}
                  </p>
                  {chat.unreadCount > 0 && (
                    <div className="unread-badge">
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatList;
