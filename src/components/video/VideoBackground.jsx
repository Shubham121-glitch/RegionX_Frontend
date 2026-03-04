import { useState, useEffect, useRef } from 'react';
import './videoBackground.css';

function VideoBackground({ 
  dayVideo, 
  nightVideo, 
  posterDay, 
  posterNight,
  overlay = true,
  overlayOpacity = 0.4,
  zoomEffect = true,
  parallax = false
}) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isMobile, setIsMobile] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Detect mobile and theme changes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Theme change listener
    const interval = setInterval(() => {
      const currentTheme = localStorage.getItem('theme') || 'dark';
      if (currentTheme !== theme) {
        setIsTransitioning(true);
        setTimeout(() => {
          setTheme(currentTheme);
          setIsTransitioning(false);
        }, 300);
      }
    }, 100);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(interval);
    };
  }, [theme]);

  // Parallax effect
  useEffect(() => {
    if (!parallax) return;

    const handleScroll = () => {
      if (containerRef.current) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.5;
        containerRef.current.style.transform = `translateY(${rate}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [parallax]);

  const currentVideo = theme === 'dark' ? nightVideo : dayVideo;
  const currentPoster = theme === 'dark' ? posterNight : posterDay;

  // Use lower quality for mobile
  const videoSrc = isMobile 
    ? currentVideo?.replace('4K', '1080p').replace('_4k', '_1080p')
    : currentVideo;

  return (
    <div 
      ref={containerRef}
      className={`video-background-container ${zoomEffect ? 'zoom-effect' : ''} ${videoLoaded ? 'loaded' : ''}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className={`video-background ${isTransitioning ? 'transitioning' : ''}`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={currentPoster}
        onLoadedData={() => setVideoLoaded(true)}
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark Overlay for text readability */}
      {overlay && (
        <div 
          className="video-overlay"
          style={{ 
            background: `linear-gradient(
              to bottom,
              rgba(0, 0, 0, ${overlayOpacity * 0.5}) 0%,
              rgba(0, 0, 0, ${overlayOpacity}) 50%,
              rgba(0, 0, 0, ${overlayOpacity * 1.2}) 100%
            )`
          }}
        />
      )}

      {/* Loading State */}
      {!videoLoaded && (
        <div className="video-loading">
          <div className="video-loading-spinner" />
        </div>
      )}
    </div>
  );
}

export default VideoBackground;
