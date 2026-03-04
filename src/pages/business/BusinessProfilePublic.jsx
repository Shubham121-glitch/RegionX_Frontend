import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiCheckCircle, 
  FiClock, 
  FiXCircle,
  FiBriefcase,
  FiGlobe,
  FiMessageCircle,
  FiArrowLeft,
  FiGrid,
  FiList,
  FiBookmark,
  FiShare2,
  FiMoreHorizontal
} from 'react-icons/fi';
import Loading from '../../components/loading/Loading';
import { getStaticMapUrl, downloadStaticMap } from '../../utils/imageHelpers';
import './businessProfilePublic.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

function BusinessProfilePublic() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const [business, setBusiness] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [userProfileImage, setUserProfileImage] = useState(null);

  useEffect(() => {
    fetchBusinessData();
  }, [businessId]);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      const [businessRes, postsRes, userRes] = await Promise.all([
        axios.get(`${API_URL}/business/${businessId}`),
        axios.get(`${API_URL}/business-posts/business/${businessId}`),
        axios.get(`${API_URL}/users/me/${businessId}`)
      ]);
      
      setBusiness(businessRes.data);
      setPosts(postsRes.data);
      setUserProfileImage(userRes.data?.profileImage || null);
    } catch (err) {
      setError('Business not found or unavailable');
      console.error('Error fetching business:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="verify-badge verified">
            <FiCheckCircle /> Verified Business
          </span>
        );
      case 'Pending Verification':
        return (
          <span className="verify-badge pending">
            <FiClock /> Pending Verification
          </span>
        );
      case 'Rejected':
        return (
          <span className="verify-badge rejected">
            <FiXCircle /> Not Verified
          </span>
        );
      default:
        return null;
    }
  };

  const handleContact = () => {
    if (!isSignedIn) {
      navigate('/sign-in');
      return;
    }
    // Navigate to chat or open contact modal
    navigate(`/chat/${businessId}`);
  };

  const handleCall = () => {
    if (business.contactInfo?.phone) {
      window.location.href = `tel:${business.contactInfo.phone}`;
    }
  };

  const handleEmail = () => {
    if (business.contactInfo?.email) {
      window.location.href = `mailto:${business.contactInfo.email}`;
    }
  };

  if (loading) return <Loading />;
  if (error || !business) {
    return (
      <div className="business-public-error">
        <FiBriefcase className="error-icon" />
        <h2>{error || 'Business Not Found'}</h2>
        <p>The business you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/services')} className="btn-back">
          <FiArrowLeft /> Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="business-public-profile insta-style">
      {/* Instagram-style Header */}
      <header className="insta-header">
        <button className="insta-back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <h2 className="insta-username">{business.businessTitle}</h2>
        <button className="insta-more-btn">
          <FiMoreHorizontal />
        </button>
      </header>

      {/* Instagram-style Profile Section */}
      <section className="insta-profile-section">
        <div className="insta-profile-header">
          {/* Avatar */}
          <div className="insta-avatar">
            <div className="insta-avatar-inner">
              {userProfileImage || business.profileImage ? (
                <img 
                  src={userProfileImage || `${BASE_URL}${business.profileImage}`} 
                  alt={business.businessTitle}
                  className="insta-avatar-img"
                />
              ) : (
                <FiBriefcase />
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="insta-stats">
            <div className="insta-stat">
              <span className="insta-stat-number">{posts.length}</span>
              <span className="insta-stat-label">posts</span>
            </div>
            <div className="insta-stat">
              <span className="insta-stat-number">{business.locations?.length || 0}</span>
              <span className="insta-stat-label">locations</span>
            </div>
            <div className="insta-stat">
              <span className="insta-stat-number">{business.regions?.length || 0}</span>
              <span className="insta-stat-label">regions</span>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="insta-profile-info">
          <h1 className="insta-name">{business.businessTitle}</h1>
          <span className="insta-category">{business.category}</span>
          {getVerificationBadge(business.verificationStatus)}
          <p className="insta-bio">{business.description}</p>
          
          {/* Contact Info in Bio */}
          <div className="insta-contact-info">
            {business.contactInfo?.phone && (
              <span className="insta-contact-item">
                <FiPhone /> {business.contactInfo.phone}
              </span>
            )}
            {business.contactInfo?.email && (
              <span className="insta-contact-item">
                <FiMail /> {business.contactInfo.email}
              </span>
            )}
          </div>

          {/* Regions */}
          {business.regions && business.regions.length > 0 && (
            <div className="insta-regions">
              <FiMapPin /> {business.regions.join(', ')}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="insta-actions">
          <button className="insta-btn insta-btn-primary" onClick={handleContact}>
            <FiMessageCircle /> Message
          </button>
          {business.contactInfo?.phone && (
            <button className="insta-btn insta-btn-secondary" onClick={handleCall}>
              <FiPhone /> Call
            </button>
          )}
          <button className="insta-btn insta-btn-icon">
            <FiShare2 />
          </button>
        </div>
      </section>

      {/* Instagram-style Tabs */}
      <div className="insta-tabs">
        <button 
          className={`insta-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <FiGrid />
        </button>
        <button 
          className={`insta-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <FiList />
        </button>
        <button 
          className={`insta-tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <FiBookmark />
        </button>
      </div>

      {/* Instagram-style Content Grid */}
      <div className="insta-content">
        {activeTab === 'posts' && (
          <>
            {posts.length > 0 ? (
              <div className="insta-grid">
                {posts.map((post, index) => (
                  <div key={post._id} className="insta-grid-item">
                    {post.image ? (
                      <img 
                        src={`${BASE_URL}${post.image}`} 
                        alt={post.title}
                        onError={(e) => { 
                          e.target.style.display = 'none'; 
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="insta-grid-placeholder" style={{display: post.image ? 'none' : 'flex'}}>
                      <FiBriefcase />
                      <span>{post.title}</span>
                    </div>
                    <div className="insta-grid-overlay">
                      <span className="insta-overlay-text">{post.title}</span>
                      {post.offer && <span className="insta-offer-badge">{post.offer}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="insta-empty">
                <div className="insta-empty-icon">
                  <FiBriefcase />
                </div>
                <h3>No Posts Yet</h3>
                <p>When {business.businessTitle} posts services, you'll see them here.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'list' && (
          <div className="insta-list">
            {posts.length > 0 ? (
              posts.map(post => (
                <div key={post._id} className="insta-list-item">
                  {post.image && (
                    <div className="insta-list-image">
                      <img 
                        src={`${BASE_URL}${post.image}`} 
                        alt={post.title}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="insta-list-content">
                    <h4>{post.title}</h4>
                    <p>{post.description}</p>
                    {post.offer && <span className="insta-offer-tag">{post.offer}</span>}
                    <div className="insta-list-location">
                      <FiMapPin /> {post.location}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="insta-empty">
                <FiBriefcase className="insta-empty-icon" />
                <h3>No Services</h3>
                <p>No services posted yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="insta-empty">
            <FiBookmark className="insta-empty-icon" />
            <h3>Saved</h3>
            <p>Save services to view them here.</p>
          </div>
        )}
      </div>

      {/* Locations Section (Instagram Story Style) */}
      {business.locations && business.locations.length > 0 && (
        <section className="insta-locations-section">
          <h3 className="insta-section-title">Locations</h3>
          <div className="insta-locations-scroll">
            {business.locations.map((location, index) => (
              <div key={index} className="insta-location-story">
                <div className="insta-location-avatar">
                  <FiMapPin />
                </div>
                <div className="insta-location-main">
                  <span className="insta-location-name">{location.placeName}</span>
                  <span className="insta-location-city">{location.city}</span>
                </div>

                <div className="insta-location-actions">
                  {location.mapLink && (
                    <a className="insta-location-map-link" href={location.mapLink} target="_blank" rel="noreferrer">Open</a>
                  )}
                  <button
                    className="insta-location-download"
                    onClick={async () => {
                      const markers = [];
                      if (location.lat != null && location.lng != null) markers.push({ lat: location.lat, lng: location.lng });
                      else if (location.mapLink) {
                        const m = String(location.mapLink).match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                        if (m) markers.push({ lat: parseFloat(m[1]), lng: parseFloat(m[2]) });
                        else markers.push({ query: `${location.placeName}, ${location.city || business.businessTitle || ''}` });
                      } else {
                        markers.push({ query: `${location.placeName}, ${location.city || business.businessTitle || ''}` });
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
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default BusinessProfilePublic;
