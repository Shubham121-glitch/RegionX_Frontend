import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUpload, FiMapPin, FiTag, FiFileText } from 'react-icons/fi';
import Loading from '../../components/loading/Loading';
import './createBusinessPost.css';

function CreateBusinessPost() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    offer: '',
    image: null,
    video: null,
    region: '',
    location: ''
  });

  useEffect(() => {
    if (isLoaded && user) {
      fetchBusiness();
    }
  }, [isLoaded, user]);

  const fetchBusiness = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/business/user/${user.id}`);
      setBusiness(response.data);
    } catch (error) {
      setError('You need to create a business first');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Get Clerk token
      const token = await getToken();
      
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('offer', formData.offer);
      submitData.append('region', formData.region);
      submitData.append('location', formData.location);
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      if (formData.video) {
        submitData.append('video', formData.video);
      }

      await axios.post('http://localhost:5000/api/business-posts', submitData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || loading) return <Loading />;
  if (!business) {
    return (
      <div className="create-post-container">
        <div className="error-message">
          You need to create a verified business before posting advertisements.
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/create-business')}>
          Create Business
        </button>
      </div>
    );
  }

  if (business.verificationStatus !== 'Verified') {
    return (
      <div className="create-post-container">
        <div className="error-message">
          Your business is pending verification. You can create posts once verified.
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
          Back to Business Profile
        </button>
      </div>
    );
  }

  return (
    <div className="create-post-container">
      <div className="create-post-wrapper">
        <h1 className="page-title">Create Advertisement</h1>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="post-form">
          {/* Title */}
          <div className="form-group">
            <label><FiFileText /> Post Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter an attractive title for your offer"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="5"
              placeholder="Describe your offer, services, or promotion..."
            />
          </div>

          {/* Offer/Discount */}
          <div className="form-group">
            <label><FiTag /> Special Offer (Optional)</label>
            <input
              type="text"
              name="offer"
              value={formData.offer}
              onChange={handleChange}
              placeholder="e.g., 20% Off, Free Guide, etc."
            />
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label><FiUpload /> Image *</label>
            <div className="file-upload-wrapper">
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              {formData.image && (
                <span className="file-name">{formData.image.name}</span>
              )}
            </div>
          </div>

          {/* Video Upload */}
          <div className="form-group">
            <label>Video (Optional)</label>
            <div className="file-upload-wrapper">
              <input
                type="file"
                name="video"
                accept="video/*"
                onChange={handleFileChange}
              />
              {formData.video && (
                <span className="file-name">{formData.video.name}</span>
              )}
            </div>
          </div>

          {/* Region */}
          <div className="form-group">
            <label><FiMapPin /> Region *</label>
            <select
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
            >
              <option value="">Select a region</option>
              {business.regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="form-group">
            <label>Specific Location *</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            >
              <option value="">Select a location</option>
              {business.locations.map((loc, index) => (
                <option key={index} value={loc.placeName}>
                  {loc.placeName}, {loc.city}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/business-profile')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateBusinessPost;
