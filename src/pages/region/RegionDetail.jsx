import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { FiMapPin, FiArrowLeft, FiPlay, FiX, FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';
import Loading from '../../components/loading/Loading';
import StarRating from '../../components/reviews/StarRating';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReviewCard from '../../components/reviews/ReviewCard';
import RegionHeroVideo from '../../components/video/RegionHeroVideo';
import GoogleMap from '../../components/Map/GoogleMap';
import { getStaticMapUrl, downloadStaticMap, getFullImageUrl } from '../../utils/imageHelpers';
import './regionDetail.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function RegionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeVideo, setActiveVideo] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [businessData, setBusinessData] = useState(null);

  useEffect(() => {
    fetchRegion();
    fetchReviews();
    if (isSignedIn) {
      checkBusinessOwner();
    }
  }, [id, isSignedIn]);

  const checkBusinessOwner = async () => {
    try {
      const response = await axios.get(`${API_URL}/business/user/${user.id}`);
      if (response.data) {
        setIsBusinessOwner(true);
        setBusinessData(response.data);
      }
    } catch (error) {
      // User doesn't have a business
      setIsBusinessOwner(false);
    }
  };

  const fetchRegion = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/regions/${id}`);
      console.log('GoogleMap: Fetched region data:', response.data);
      setRegion(response.data);
    } catch (err) {
      setError('Failed to load region details. Please try again.');
      console.error('Error fetching region:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await axios.get(`${API_URL}/reviews/${id}`);
      setReviews(response.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewAdded = (newReview) => {
    setReviews([newReview, ...reviews]);
    // Update region stats
    fetchRegion();
  };

  const handleReviewDeleted = (reviewId) => {
    setReviews(reviews.filter(r => r._id !== reviewId));
    fetchRegion();
  };

  const handleReviewUpdated = (reviewId, updatedReview) => {
    setReviews(reviews.map(r => r._id === reviewId ? updatedReview : r));
    fetchRegion();
  };

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setSelectedImage(region.images[index] || region.thumbnail);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    const newIndex = (currentImageIndex + 1) % region.images.length;
    setCurrentImageIndex(newIndex);
    setSelectedImage(region.images[newIndex]);
  };

  const prevImage = () => {
    const newIndex = (currentImageIndex - 1 + region.images.length) % region.images.length;
    setCurrentImageIndex(newIndex);
    setSelectedImage(region.images[newIndex]);
  };

  if (loading) return <Loading />;
  if (error) return <div className="error-message">{error}</div>;
  if (!region) return <div className="error-message">Region not found</div>;

  const allImages = [region.thumbnail, ...region.images].filter(Boolean);

  return (
    <div className="region-detail-container">
      {/* Cinematic Hero Section with Video Background */}
      <section className="region-hero">
        <RegionHeroVideo 
          regionSlug={region.slug}
          regionName={region.regionName}
          regionThumbnail={getFullImageUrl(region.thumbnail)}
        />
        <div className="region-hero-content">
          {/* Back button removed as requested */}
          <h1 className="region-hero-title">{region.regionName}</h1>
          <p className="region-hero-subtitle">{region.shortDescription}</p>
          
          {/* Rating Display */}
          <div className="hero-rating">
            <StarRating rating={Math.round(region.averageRating)} readOnly size="medium" />
            <span className="rating-value">{region.averageRating.toFixed(1)}</span>
            <span className="rating-count">({region.totalReviews} {region.totalReviews === 1 ? 'Review' : 'Reviews'})</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="region-content-wrapper">
        {/* Description Section */}
        <section className="region-section">
          <h2 className="section-heading">About {region.regionName}</h2>
          <p className="region-description">{region.detailedDescription}</p>
        </section>

        {/* Image Gallery */}
        {allImages.length > 0 && (
          <section className="region-section">
            <h2 className="section-heading">Gallery</h2>
            <div className="gallery-grid">
              {allImages.map((image, index) => (
                <div 
                  key={index} 
                  className="gallery-item"
                  onClick={() => openLightbox(index)}
                >
                  <img 
                    src={getFullImageUrl(image)} 
                    alt={`${region.regionName} ${index + 1}`}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Videos Section */}
        {region.videos && region.videos.length > 0 && (
          <section className="region-section">
            <h2 className="section-heading">Videos</h2>
            <div className="videos-grid">
              {region.videos.map((video, index) => (
                <div key={index} className="video-item">
                  <video 
                    src={getFullImageUrl(video)}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="video-player"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Heritage & Culture Sections - Consolidated for Minimalism */}
        {(region.history || region.culturalValues || region.traditions) && (
          <section className="region-section heritage-consolidated">
            <h2 className="section-heading">Heritage & Culture</h2>
            <div className="heritage-grid">
              {region.history && (
                <div className="info-card">
                  <h3 className="sub-heading">History</h3>
                  <p>{region.history}</p>
                </div>
              )}
              {region.culturalValues && (
                <div className="info-card culture-card">
                  <h3 className="sub-heading">Cultural Values</h3>
                  <p>{region.culturalValues}</p>
                </div>
              )}
              {region.traditions && (
                <div className="info-card traditions-card">
                  <h3 className="sub-heading">Traditions</h3>
                  <p>{region.traditions}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Places to Visit */}
        {region.placesToVisit && region.placesToVisit.length > 0 && (
          <section className="region-section">
            <h2 className="section-heading">Places to Visit</h2>
            <div className="places-grid">
              {region.placesToVisit.map((place, index) => (
                <div key={index} className="place-card">
                  {place.image && (
                    <div className="place-image-wrapper">
                      <img 
                        src={getFullImageUrl(place.image)} 
                        alt={place.name}
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="place-content">
                    <div className="place-header">
                      <FiMapPin className="place-icon" />
                      <h3>{place.name}</h3>
                    </div>

                    <p>{place.description}</p>

                    {/* Inline map for the place (uses GoogleMap component). Falls back to a static map if the live API is restricted/fails. */}
                    <div className="place-map">
                      <GoogleMap
                        query={`${place.name}, ${region.regionName}`}
                        markers={[{ title: place.name, query: place.name }]}
                        height="180px"
                        zoom={13}
                      />
                    </div>

                    {/* Simplified: Removed redundant map links and buttons to keep it minimalist */}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section className="region-section reviews-section">
          <h2 className="section-heading">
            <FiStar /> Reviews & Ratings
          </h2>
          
          {/* Review Form */}
          <ReviewForm 
            regionId={region._id} 
            onReviewAdded={handleReviewAdded}
          />

          {/* Reviews List */}
          <div className="reviews-list">
            <h3 className="reviews-subtitle">
              {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
            </h3>
            
            {reviewsLoading ? (
              <div className="reviews-loading">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="no-reviews">
                <FiStar className="no-reviews-icon" />
                <p>No reviews yet. Be the first to review this region!</p>
              </div>
            ) : (
              <div className="reviews-grid">
                {reviews.map((review, index) => (
                  <ReviewCard 
                    key={review._id}
                    review={review}
                    onDelete={handleReviewDeleted}
                    onUpdate={handleReviewUpdated}
                    isBusinessOwner={isBusinessOwner}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            <FiX />
          </button>
          <button className="lightbox-nav prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
            <FiChevronLeft />
          </button>
          <img 
            src={getFullImageUrl(selectedImage)} 
            alt="Gallery"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="lightbox-nav next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
            <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}

export default RegionDetail;
