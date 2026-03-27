import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FiHeart, FiMessageSquare, FiShare2, FiThumbsDown, FiMoreHorizontal, FiMusic, FiSkipForward, FiPlus, FiX } from 'react-icons/fi';
import { useUser, useAuth } from '@clerk/clerk-react';
import { getFullImageUrl } from '../utils/imageHelpers';
import './shorts.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

function Shorts() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [videos, setVideos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const videoRefs = useRef(new Map());

  // Fetch videos with pagination
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/videos`, {
        params: { page, limit: 5 },
      });
      if (res.data?.videos?.length) {
        setVideos((prev) => [...prev, ...res.data.videos]);
      }
    } catch (err) {
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // IntersectionObserver for autoplay logic
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.75,
    };

    let currentPlaying = null;

    const callback = (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          if (currentPlaying && currentPlaying !== video) {
            currentPlaying.pause();
            currentPlaying.currentTime = 0;
          }
          video.play().catch(() => {});
          video.muted = false;
          currentPlaying = video;
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    };

    const observer = new IntersectionObserver(callback, options);

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      observer.disconnect();
    };
  }, [videos]);

  // Load more on scroll near bottom
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100 && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  // Like toggle handler
  const toggleLike = async (videoId, liked) => {
    if (!user) return;
    try {
      if (liked) {
        await axios.delete(`${API_URL}/videos/${videoId}/unlike`, {
          data: { userId: user.id }
        });
      } else {
        await axios.post(`${API_URL}/videos/${videoId}/like`, {
          userId: user.id
        });
      }
      setVideos((prev) =>
        prev.map((v) =>
          v._id === videoId
            ? {
                ...v,
                likes: liked
                  ? (v.likes || []).filter((like) => like.userId !== user.id)
                  : [...(v.likes || []), { userId: user.id }],
              }
            : v
        )
      );
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  };

  const handleShare = async (video) => {
    const shareData = {
      title: 'RegionX Short',
      text: `Check out this short by @${video.userId}: ${video.caption}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled or failed');
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleComment = (videoId) => {
    // Navigate to region or just show alert for now
    alert('Comments coming soon to this region!');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size (Base64 grows by 33%, and MongoDB limit is 16MB)
    // Keep it safely below 12MB
    if (file.size > 12 * 1024 * 1024) {
      alert('Video file is too large! Please keep it under 12MB.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('caption', `A short by ${user?.fullName || 'Anonymous'}`);

    try {
      const token = await getToken();
      const response = await axios.post(`${API_URL}/videos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.data.success) {
        alert('Short uploaded successfully!');
        setPage(1); // Reset to page 1
        setVideos([]); // Clear current (trigger refetch)
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="shorts-container"
      ref={containerRef}
      onScroll={handleScroll}
      tabIndex={0}
    >
      {videos.map((video) => {
        const liked = user && (video.likes || []).some((like) => like.userId === user.id);
        return (
          <div key={video._id} className="shorts-wrapper">
            <div className="shorts-video-container">
              <video
                ref={(el) => videoRefs.current.set(video._id, el)}
                src={getFullImageUrl(video.videoUrl)}
                className="shorts-video"
                playsInline
                muted
                loop
                preload="metadata"
                onClick={(e) => {
                  if (e.target.paused) e.target.play();
                  else e.target.pause();
                }}
              />
              
              <div className="shorts-overlay">
                {/* Information Area (Bottom Left) */}
                <div className="shorts-info-section">
                  <div className="shorts-user-row">
                    <div className="shorts-avatar">
                      <img 
                        src={video.uploaderImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.uploaderName || video.userId}`} 
                        alt={video.uploaderName} 
                        onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.uploaderName || video.userId}`; }}
                      />
                    </div>
                    <div className="uploader-meta-info">
                      <span className="shorts-username">{video.uploaderName || 'User'}</span>
                      {video.uploaderEmail && <span className="shorts-email">{video.uploaderEmail}</span>}
                    </div>
                  </div>
                  <div className="shorts-caption">{video.caption}</div>
                  <div className="shorts-music">
                    <FiMusic className="music-icon" />
                    <div className="music-ticker">
                      <div className="music-name">Original Audio • {video.uploaderName || 'Creator'}</div>
                    </div>
                  </div>
                </div>

                {/* Actions Area (Right Side) */}
                <div className="shorts-actions-section">
                  <div className="action-item">
                    <button className={`action-btn like-btn ${liked ? 'liked' : ''}`} onClick={() => toggleLike(video._id, liked)}>
                      <FiHeart />
                    </button>
                    <span>{video.likes?.length || 0}</span>
                  </div>
                  <div className="action-item">
                    <button className="action-btn" onClick={() => handleComment(video._id)}>
                      <FiMessageSquare />
                    </button>
                    <span>{video.comments?.length || 0}</span>
                  </div>
                  <div className="action-item">
                    <button className="action-btn" onClick={() => handleShare(video)}>
                      <FiShare2 />
                    </button>
                    <span>Share</span>
                  </div>
                  <div className="action-item more-item">
                    <button className="action-btn">
                      <FiMoreHorizontal />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {loading && <div className="shorts-loader">Loading...</div>}
      {error && <div className="shorts-error">{error}</div>}
    </div>
  );
}

export default Shorts;