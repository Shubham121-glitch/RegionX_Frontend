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
import { getStaticMapUrl, downloadStaticMap } from '../../utils/imageHelpers';
import './regionDetail.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

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
          regionThumbnail={region.thumbnail}
        />
        <div className="region-hero-content">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>
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
                    src={`${BASE_URL}${image}`} 
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
                    src={`${BASE_URL}${video}`}
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

        {/* History Section */}
        <section className="region-section">
          <h2 className="section-heading">History</h2>
          <div className="info-card">
            <p>{region.history}</p>
          </div>
        </section>

        {/* Culture Section */}
        <section className="region-section">
          <h2 className="section-heading">Cultural Values</h2>
          <div className="info-card culture-card">
            <p>{region.culturalValues}</p>
          </div>
        </section>

        {/* Traditions Section */}
        <section className="region-section">
          <h2 className="section-heading">Traditions</h2>
          <div className="info-card traditions-card">
            <p>{region.traditions}</p>
          </div>
        </section>

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
                        src={`${BASE_URL}${place.image}`} 
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

                    {/* Inline map for the place (uses GoogleMap component). Falls back to a link when no API key is configured. */}
                    <div className="place-map">
                      <GoogleMap
                        query={`${place.name}${place.address ? `, ${place.address}` : `, ${region.regionName}`}`}
                        markers={[{ title: place.name, query: place.mapLink || place.name }]}
                        height="180px"
                        zoom={13}
                      />
                    </div>

                    {place.mapLink && (
                      <a className="place-open-link" href={place.mapLink} target="_blank" rel="noreferrer">
                        Open in Google Maps
                      </a>
                    )}

                    <button className="place-download-btn" onClick={() => downloadPlaceMap(place)}>
                      ⬇️ Download map
                    </button>
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
            src={`${BASE_URL}${selectedImage}`} 
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
