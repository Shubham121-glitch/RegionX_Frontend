import { useState, useEffect } from 'react';
import VideoBackground from './VideoBackground';
import './regionHeroVideo.css';

// Video data for regions - Replace with actual 4K videos
const regionVideos = {
  europe: {
    day: '/videos/europe-day.mp4',
    night: '/videos/europe-night.mp4',
    posterDay: '/videos/europe-day-poster.jpg',
    posterNight: '/videos/europe-night-poster.jpg'
  },
  asia: {
    day: '/videos/asia-day.mp4',
    night: '/videos/asia-night.mp4',
    posterDay: '/videos/asia-day-poster.jpg',
    posterNight: '/videos/asia-night-poster.jpg'
  },
  'north-america': {
    day: '/videos/north-america-day.mp4',
    night: '/videos/north-america-night.mp4',
    posterDay: '/videos/north-america-day-poster.jpg',
    posterNight: '/videos/north-america-night-poster.jpg'
  },
  'south-america': {
    day: '/videos/south-america-day.mp4',
    night: '/videos/south-america-night.mp4',
    posterDay: '/videos/south-america-day-poster.jpg',
    posterNight: '/videos/south-america-night-poster.jpg'
  },
  africa: {
    day: '/videos/africa-day.mp4',
    night: '/videos/africa-night.mp4',
    posterDay: '/videos/africa-day-poster.jpg',
    posterNight: '/videos/africa-night-poster.jpg'
  },
  oceania: {
    day: '/videos/oceania-day.mp4',
    night: '/videos/oceania-night.mp4',
    posterDay: '/videos/oceania-day-poster.jpg',
    posterNight: '/videos/oceania-night-poster.jpg'
  }
};

// Default fallback video
const defaultVideo = {
  day: '/videos/default-day.mp4',
  night: '/videos/default-night.mp4',
  posterDay: '/videos/default-day-poster.jpg',
  posterNight: '/videos/default-night-poster.jpg'
};

function RegionHeroVideo({ regionSlug, regionName, regionThumbnail }) {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get video data based on region slug
    const videos = regionVideos[regionSlug] || defaultVideo;
    
    // Check if videos exist (in production, you'd verify URLs)
    setVideoData(videos);
    setLoading(false);
  }, [regionSlug]);

  if (loading) {
    return (
      <div className="region-hero-video-loading">
        <div className="region-hero-video-spinner" />
      </div>
    );
  }

  // If no video data or using fallback, show thumbnail with gradient
  if (!videoData || videoData === defaultVideo) {
    return (
      <div 
        className="region-hero-fallback"
        style={{
          backgroundImage: `url(http://localhost:5000${regionThumbnail})`
        }}
      >
        <div className="region-hero-fallback-overlay" />
      </div>
    );
  }

  return (
    <div className="region-hero-video-container">
      <VideoBackground
        dayVideo={videoData.day}
        nightVideo={videoData.night}
        posterDay={videoData.posterDay}
        posterNight={videoData.posterNight}
        overlay={true}
        overlayOpacity={0.4}
        zoomEffect={true}
        parallax={true}
      />
    </div>
  );
}

export default RegionHeroVideo;
export { regionVideos };
