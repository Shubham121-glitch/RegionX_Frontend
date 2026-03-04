import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function useChatNotifications(userId) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/chat/unread/${userId}`);
      setUnreadCount(response.data?.totalUnread ?? 0);
    } catch (error) {
      const isNetworkError = error?.code === 'ERR_NETWORK' || error?.message === 'Network Error';
      if (!isNetworkError) {
        console.error('Error fetching unread count:', error);
      }
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [userId, fetchUnreadCount]);

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    loading,
    fetchUnreadCount,
    clearUnreadCount,
  };
}
