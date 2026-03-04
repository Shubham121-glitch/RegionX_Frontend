import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './shorts.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

function Shorts() {
  const [videos, setVideos] = useState([]);
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
    try {
      if (liked) {
        await axios.delete(`${API_URL}/videos/${videoId}/unlike`);
      } else {
        await axios.post(`${API_URL}/videos/${videoId}/like`);
      }
      setVideos((prev) =>
        prev.map((v) =>
          v._id === videoId
            ? {
                ...v,
                likes: liked
                  ? v.likes.filter((like) => like.userId !== 'currentUser')
                  : [...v.likes, { userId: 'currentUser' }],
              }
            : v
        )
      );
    } catch (err) {
      console.error('Failed to toggle like', err);
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
        const liked = video.likes.some((like) => like.userId === 'currentUser');
        return (
          <div key={video._id} className="shorts-video-wrapper">
            <video
              ref={(el) => videoRefs.current.set(video._id, el)}
              src={video.videoUrl.startsWith('http') ? video.videoUrl : `${BASE_URL}${video.videoUrl}`}
              className="shorts-video"
              playsInline
              muted
              loop
              preload="metadata"
            />
            <div className="shorts-overlay">
              <div className="shorts-info">
                <div className="shorts-username">@{video.userId}</div>
                <div className="shorts-caption">{video.caption}</div>
                <div className="shorts-timestamp">
                  {new Date(video.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="shorts-controls">
                <button
                  className={`like-btn ${liked ? 'liked' : ''}`}
                  onClick={() => toggleLike(video._id, liked)}
                  aria-label="Like"
                >
                  ❤️ {video.likes.length}
                </button>
                <button className="comment-btn" aria-label="Comment">
                  💬
                </button>
                <button className="share-btn" aria-label="Share">
                  🔗
                </button>
                <button className="save-btn" aria-label="Save">
                  🔖
                </button>
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