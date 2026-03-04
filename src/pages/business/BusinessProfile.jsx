import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiEdit2, FiPlus, FiMessageCircle, FiCheckCircle, FiClock, FiXCircle, FiMapPin, FiPhone, FiMail, FiGlobe } from 'react-icons/fi';
import Loading from '../../components/loading/Loading';
import { getStaticMapUrl, downloadStaticMap } from '../../utils/imageHelpers';
import './businessProfile.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

function BusinessProfile() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      fetchBusinessData();
    }
  }, [isLoaded, user]);

  const fetchBusinessData = async () => {
    try {
      // First fetch business by userId
      const businessRes = await axios.get(`${API_URL}/business/user/${user.id}`);
      setBusiness(businessRes.data);
      
      // Then fetch posts using the business MongoDB _id
      const postsRes = await axios.get(`${API_URL}/business-posts/business/${businessRes.data._id}`);
      setPosts(postsRes.data);
    } catch (error) {
      console.error('Error fetching business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="verification-badge verified">
            <FiCheckCircle /> Verified
          </span>
        );
      case 'Pending Verification':
        return (
          <span className="verification-badge pending">
            <FiClock /> Pending Verification
          </span>
        );
      case 'Rejected':
        return (
          <span className="verification-badge rejected">
            <FiXCircle /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (!isLoaded || loading) return <Loading />;
  if (!business) return <div className="error-message">Business not found</div>;

  return (
    <div className="business-profile-container">
      {/* Hero Section */}
      <section className="business-hero">
        <div className="business-hero-content">
          <div className="business-header">
            <div className="business-title-section">
              <h1 className="business-name">{business.businessTitle}</h1>
              {getVerificationBadge(business.verificationStatus)}
            </div>
            <span className="business-category-tag">{business.category}</span>
          </div>

          <div className="business-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
              <FiEdit2 /> Edit Business
            </button>
            {business.verificationStatus === 'Verified' && (
              <button className="btn btn-primary" onClick={() => navigate('/create-business-post')}>
                <FiPlus /> Create Post
              </button>
            )}
            <button className="btn btn-chat">
              <FiMessageCircle /> Chat with Business
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="business-content-wrapper">
        {/* About Section */}
        <section className="business-section">
          <h2 className="section-heading">About</h2>
          <p className="business-description">{business.description}</p>
        </section>

        {/* Regions & Locations */}
        <section className="business-section">
          <h2 className="section-heading">
            <FiGlobe /> Service Areas
          </h2>
          <div className="regions-tags">
            {business.regions.map((region, index) => (
              <span key={index} className="region-tag">{region}</span>
            ))}
          </div>
          <div className="locations-list">
            {business.locations.map((location, index) => (
              <div key={index} className="location-item">
                <FiMapPin className="location-icon" />
                <div className="location-details">
                  <span className="location-name">{location.placeName}</span>
                  <span className="location-area">{location.area}, {location.city}</span>
                  {location.mapLink && (
                    <>
                      <a href={location.mapLink} target="_blank" rel="noopener noreferrer" className="map-link">
                        View on Map
                      </a>
                      <button
                        className="map-download-btn"
                        onClick={async () => {
                          const markers = [];
                          if (location.lat != null && location.lng != null) markers.push({ lat: location.lat, lng: location.lng });
                          else if (location.mapLink) {
                            const m = String(location.mapLink).match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                            if (m) markers.push({ lat: parseFloat(m[1]), lng: parseFloat(m[2]) });
                            else markers.push({ query: `${location.placeName}, ${location.city || ''}` });
                          } else {
                            markers.push({ query: `${location.placeName}, ${location.city || ''}` });
                          }

                          if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
                            window.open(location.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.placeName)}`, '_blank');
                            return;
                          }

                          try {
                            await downloadStaticMap({ markers, size: '1200x800', filename: `${(location.placeName || 'map').replace(/\s+/g, '_')}.png` });
                          } catch (err) {
                            console.error('Download failed', err);
                            const url = getStaticMapUrl({ markers, size: '1200x800' });
                            if (url) window.open(url, '_blank');
                          }
                        }}
                      >
                        ⬇️ Download map
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Info */}
        <section className="business-section">
          <h2 className="section-heading">Contact Information</h2>
          <div className="contact-grid">
            <div className="contact-item">
              <FiPhone className="contact-icon" />
              <div>
                <span className="contact-label">Phone</span>
                <span className="contact-value">{business.contactInfo.phone}</span>
              </div>
            </div>
            {business.contactInfo.whatsapp && (
              <div className="contact-item">
                <FiPhone className="contact-icon whatsapp" />
                <div>
                  <span className="contact-label">WhatsApp</span>
                  <span className="contact-value">{business.contactInfo.whatsapp}</span>
                </div>
              </div>
            )}
            <div className="contact-item">
              <FiMail className="contact-icon" />
              <div>
                <span className="contact-label">Email</span>
                <span className="contact-value">{business.contactInfo.email}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Posts Section */}
        {business.verificationStatus === 'Verified' && (
          <section className="business-section posts-section">
            <h2 className="section-heading">Advertisements & Offers</h2>
            {posts.length === 0 ? (
              <div className="no-posts">
                <p>No posts yet. Create your first advertisement!</p>
                <button className="btn btn-primary" onClick={() => navigate('/create-business-post')}>
                  <FiPlus /> Create Post
                </button>
              </div>
            ) : (
              <div className="posts-grid">
                {posts.map((post) => (
                  <div key={post._id} className="post-card">
                    {post.image && (
                      <div className="post-image-wrapper">
                        <img src={`${BASE_URL}${post.image}`} alt={post.title} />
                      </div>
                    )}
                    <div className="post-content">
                      <h3 className="post-title">{post.title}</h3>
                      <p className="post-description">{post.description.substring(0, 100)}...</p>
                      {post.offer && (
                        <span className="post-offer">{post.offer}</span>
                      )}
                      <div className="post-meta">
                        <span className="post-location">
                          <FiMapPin /> {post.location}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default BusinessProfile;
