import { useState, useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUser, FiGrid, FiBriefcase, FiPlus, FiSettings, FiCheckCircle, FiClock, FiXCircle, FiMapPin, FiPhone, FiMail, FiMessageCircle, FiEdit3, FiVideo } from 'react-icons/fi';
import Loading from '../../components/loading/Loading';
import './profile.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

function Profile() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [posts, setPosts] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchBusinessData();
    }
  }, [isLoaded, user]);

  const fetchBusinessData = async () => {
    try {
      // Fetch Business
      const businessRes = await axios.get(`${API_URL}/business/user/${user.id}`);
      setBusiness(businessRes.data);
      
      if (businessRes.data) {
        const postsRes = await axios.get(`${API_URL}/business-posts/business/${businessRes.data._id}`);
        setPosts(postsRes.data);
      }

      // Fetch Shorts by this user
      const shortsRes = await axios.get(`${API_URL}/videos`); // We'll filter on frontend or add backend route
      // For now, filter by userId on frontend
      const myShorts = (shortsRes.data?.videos || []).filter(v => v.userId === user.id);
      setShorts(myShorts);

    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUploadShort = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      alert('Short video is too large! Please keep it under 12MB.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('caption', `A new short by ${user.fullName}`);

    try {
      const token = await getToken();
      const res = await axios.post(`${API_URL}/videos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.data.success) {
        alert('Short uploaded successfully!');
        fetchBusinessData(); // Refresh list
      }
    } catch (err) {
      console.error('Short upload failed:', err);
      alert('Failed to upload short.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'Verified':
        return <span className="verify-badge verified"><FiCheckCircle /></span>;
      case 'Pending Verification':
        return <span className="verify-badge pending"><FiClock /></span>;
      case 'Rejected':
        return <span className="verify-badge rejected"><FiXCircle /></span>;
      default:
        return null;
    }
  };

  if (!isLoaded || loading) return <Loading />;

  return (
    <div className="profile-container">
      {/* Instagram-style Profile Header */}
      <div className="profile-header-section">
        <div className="profile-header-content">
          {/* Avatar */}
          <div className="profile-avatar-large">
            <div className="avatar-ring">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt={user.fullName} />
              ) : (
                <div className="avatar-placeholder">
                  <FiUser />
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="profile-info-section">
            <div className="profile-name-row">
              <h1 className="profile-username">{user.fullName || 'User'}</h1>
              {getVerificationBadge(business?.verificationStatus)}
            </div>
            
            <p className="profile-email">{user.primaryEmailAddress?.emailAddress}</p>
            
            <div className="user-type-badge">
              {business ? (
                <span className="badge business-badge">Business Owner</span>
              ) : (
                <span className="badge user-badge">Simple User</span>
              )}
            </div>
            
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-count">{posts.length}</span>
                <span className="stat-label">posts</span>
              </div>
              <div className="stat-item">
                <span className="stat-count">{business?.regions?.length || 0}</span>
                <span className="stat-label">regions</span>
              </div>
              <div className="stat-item">
                <span className="stat-count">{business?.locations?.length || 0}</span>
                <span className="stat-label">locations</span>
              </div>
            </div>

            <div className="profile-actions-row">
              <button 
                className="btn-profile btn-edit-profile"
                onClick={() => navigate('/edit-profile')}
              >
                <FiEdit3 /> Edit Profile
              </button>
              
              {business ? (
                <>
                  <button 
                    className="btn-profile btn-edit"
                    onClick={() => navigate('/edit-business')}
                  >
                    <FiSettings /> Edit Business
                  </button>
                  <button 
                    className="btn-profile btn-chat"
                    onClick={() => navigate('/chat')}
                  >
                    <FiMessageCircle /> Chat
                  </button>
                  {business.verificationStatus === 'Verified' && (
                    <button 
                      className="btn-profile btn-create"
                      onClick={() => navigate('/create-business-post')}
                    >
                      <FiPlus /> New Post
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button 
                    className="btn-profile btn-create"
                    onClick={() => navigate('/create-business')}
                  >
                    <FiPlus /> Create Business
                  </button>
                  <button 
                    className="btn-profile btn-chat"
                    onClick={() => navigate('/chat')}
                  >
                    <FiMessageCircle /> Chat
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="profile-bio">
          {business ? (
            <>
              <h2 className="business-name">{business.businessTitle}</h2>
              <p className="business-category-tag">{business.category}</p>
              <p className="bio-text">{business.description}</p>
              <div className="contact-info">
                {business.contactInfo?.phone && (
                  <span><FiPhone /> {business.contactInfo.phone}</span>
                )}
                {business.contactInfo?.email && (
                  <span><FiMail /> {business.contactInfo.email}</span>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="business-name">Travel Enthusiast</h2>
              <p className="bio-text">Explore the world with RegionX. Create your business to start offering services.</p>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <FiGrid /> POSTS
        </button>
        <button 
          className={`tab-btn ${activeTab === 'shorts' ? 'active' : ''}`}
          onClick={() => setActiveTab('shorts')}
        >
          <FiVideo /> SHORTS
        </button>
        <button 
          className={`tab-btn ${activeTab === 'business' ? 'active' : ''}`}
          onClick={() => setActiveTab('business')}
        >
          <FiBriefcase /> BUSINESS
        </button>
      </div>

      {/* Content */}
      <div className="profile-content">
        {activeTab === 'posts' ? (
          <div className="posts-grid">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post._id} className="post-grid-item">
                  <img 
                    src={`${BASE_URL}${post.image}`} 
                    alt={post.title}
                    onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                  />
                  <div className="post-overlay">
                    <h4>{post.title}</h4>
                    {post.offer && <span className="post-offer-badge">{post.offer}</span>}
                    <span className="post-location"><FiMapPin /> {post.location}</span>
                  </div>
                </div>
              ))
            ) : business ? (
              <div className="empty-state">
                <FiGrid className="empty-icon" />
                <h3>No Posts Yet</h3>
                <p>Share your offers and services with the world</p>
                {business.verificationStatus === 'Verified' && (
                  <button 
                    className="btn-profile btn-create"
                    onClick={() => navigate('/create-business-post')}
                  >
                    Create Your First Post
                  </button>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <FiBriefcase className="empty-icon" />
                <h3>No Business Yet</h3>
                <p>Create a business to start posting</p>
                <button 
                  className="btn-profile btn-create"
                  onClick={() => navigate('/create-business')}
                >
                  Create Business
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'shorts' ? (
          <div className="shorts-profile-grid">
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="video/*" 
              onChange={handleUploadShort} 
              hidden 
            />
            
            <div className="shorts-grid-header">
              <h3>My Shorts</h3>
              <button 
                className="btn-upload-short" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : <><FiPlus /> Upload Short</>}
              </button>
            </div>

            <div className="posts-grid">
              {shorts.length > 0 ? (
                shorts.map((short) => (
                  <div key={short._id} className="post-grid-item short-item">
                    <video src={short.videoUrl} muted />
                    <div className="post-overlay">
                      <FiVideo className="short-icon-overlay" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <FiVideo className="empty-icon" />
                  <h3>No Shorts Yet</h3>
                  <p>Share your moments in vertical video</p>
                  <button 
                    className="btn-profile btn-create"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Your First Short
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="business-info-section">
            {business ? (
              <div className="business-details-card">
                <h3>Business Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{business.category}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">{business.verificationStatus}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Regions:</span>
                  <div className="regions-tags">
                    {business.regions.map((region, idx) => (
                      <span key={idx} className="region-tag">{region}</span>
                    ))}
                  </div>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Locations:</span>
                  <span className="detail-value">{business.locations.length} places</span>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <FiBriefcase className="empty-icon" />
                <h3>No Business Information</h3>
                <p>Create your business profile to see details here</p>
                <button 
                  className="btn-profile btn-create"
                  onClick={() => navigate('/create-business')}
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
