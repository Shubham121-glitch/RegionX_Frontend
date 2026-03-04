import { useState, useRef, useEffect } from 'react';
import { FiPlay, FiX, FiVolume2, FiVolumeX } from 'react-icons/fi';
import './videoGallery.css';

// Sample video clips data - Replace with actual region-specific videos
const sampleClips = [
  {
    id: 1,
    title: 'Aerial View',
    thumbnail: '/clips/thumb1.jpg',
    video: '/clips/clip1.mp4',
    duration: '0:15'
  },
  {
    id: 2,
    title: 'Sunset Timelapse',
    thumbnail: '/clips/thumb2.jpg',
    video: '/clips/clip2.mp4',
    duration: '0:20'
  },
  {
    id: 3,
    title: 'City Lights',
    thumbnail: '/clips/thumb3.jpg',
    video: '/clips/clip3.mp4',
    duration: '0:18'
  },
  {
    id: 4,
    title: 'Drone Flyover',
    thumbnail: '/clips/thumb4.jpg',
    video: '/clips/clip4.mp4',
    duration: '0:25'
  },
  {
    id: 5,
    title: 'Cultural Festival',
    thumbnail: '/clips/thumb5.jpg',
    video: '/clips/clip5.mp4',
    duration: '0:22'
  },
  {
    id: 6,
    title: 'Nature Close-up',
    thumbnail: '/clips/thumb6.jpg',
    video: '/clips/clip6.mp4',
    duration: '0:16'
  }
];

function VideoGallery({ regionId, clips = sampleClips }) {
  const [activeVideo, setActiveVideo] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [loadedVideos, setLoadedVideos] = useState(new Set());
  const videoRef = useRef(null);

  useEffect(() => {
    if (activeVideo && videoRef.current) {
      videoRef.current.play();
    }
  }, [activeVideo]);

  const openVideo = (clip) => {
    setActiveVideo(clip);
    setIsMuted(true);
  };

  const closeVideo = () => {
    setActiveVideo(null);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleVideoLoad = (clipId) => {
    setLoadedVideos(prev => new Set([...prev, clipId]));
  };

  return (
    <div className="video-gallery-section">
      <h2 className="video-gallery-title">Explore Through Video</h2>
      
      <div className="video-gallery-grid">
        {clips.map((clip, index) => (
          <div 
            key={clip.id}
            className={`video-gallery-item ${loadedVideos.has(clip.id) ? 'loaded' : ''}`}
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => openVideo(clip)}
          >
            <div className="video-gallery-thumbnail">
              <img 
                src={clip.thumbnail} 
                alt={clip.title}
                loading="lazy"
                onLoad={() => handleVideoLoad(clip.id)}
              />
              <div className="video-gallery-overlay">
                <div className="play-button">
                  <FiPlay />
                </div>
                <span className="video-duration">{clip.duration}</span>
              </div>
            </div>
            <h3 className="video-gallery-item-title">{clip.title}</h3>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div className="video-modal" onClick={closeVideo}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={closeVideo}>
              <FiX />
            </button>
            
            <div className="video-modal-player">
              <video
                ref={videoRef}
                src={activeVideo.video}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                controls={false}
              />
              
              <button className="video-mute-toggle" onClick={toggleMute}>
                {isMuted ? <FiVolumeX /> : <FiVolume2 />}
              </button>
            </div>
            
            <h3 className="video-modal-title">{activeVideo.title}</h3>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoGallery;
