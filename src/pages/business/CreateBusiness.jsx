import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiMinus, FiUpload, FiMapPin, FiPhone, FiMail, FiFileText, FiGlobe } from 'react-icons/fi';
import Loading from '../../components/loading/Loading';
import './createBusiness.css';

const categories = ['Guide', 'Medical', 'Restaurants', 'Home Stays', 'Travel and Transport'];

function CreateBusiness() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regions, setRegions] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    businessTitle: '',
    category: '',
    licenseNumber: '',
    licenseDocument: null,
    profileImage: null,
    regions: [],
    locations: [{ region: '', city: '', area: '', placeName: '', mapLink: '' }],
    description: '',
    contactInfo: {
      phone: '',
      whatsapp: '',
      email: user?.primaryEmailAddress?.emailAddress || ''
    }
  });
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // Fetch regions from database
  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    setRegionsLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:5000/api/regions');
      console.log('Regions fetched:', response.data);
      setRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
      setError('Failed to load regions. Please check if backend is running.');
    } finally {
      setRegionsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, [name]: value }
    }));
  };

  const handleRegionToggle = (region) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region]
    }));
  };

  const handleLocationChange = (index, field, value) => {
    const newLocations = [...formData.locations];
    newLocations[index][field] = value;
    setFormData(prev => ({ ...prev, locations: newLocations }));
  };

  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, { region: '', city: '', area: '', placeName: '', mapLink: '' }]
    }));
  };

  const removeLocation = (index) => {
    if (formData.locations.length > 1) {
      setFormData(prev => ({
        ...prev,
        locations: prev.locations.filter((_, i) => i !== index)
      }));
    }
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, licenseDocument: e.target.files[0] }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profileImage: file }));
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get Clerk token
      const token = await getToken();
      
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('businessTitle', formData.businessTitle);
      submitData.append('category', formData.category);
      submitData.append('regions', JSON.stringify(formData.regions));
      submitData.append('locations', JSON.stringify(formData.locations));
      submitData.append('description', formData.description);
      submitData.append('contactInfo', JSON.stringify(formData.contactInfo));
      
      if (formData.category !== 'Home Stays') {
        submitData.append('licenseNumber', formData.licenseNumber);
        if (formData.licenseDocument) {
          submitData.append('licenseDocument', formData.licenseDocument);
        }
      }
      
      if (formData.profileImage) {
        submitData.append('profileImage', formData.profileImage);
      }

      await axios.post('http://localhost:5000/api/business', submitData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  const needsLicense = formData.category && formData.category !== 'Home Stays';

  if (!isLoaded) return <Loading />;

  return (
    <div className="create-business-container">
      <div className="create-business-wrapper">
        <h1 className="page-title">Create Your Business</h1>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="business-form">
          {/* Profile Image */}
          <div className="form-group profile-image-group">
            <label>Business Profile Image</label>
            <div className="profile-image-upload">
              <div className="profile-image-preview">
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="Profile preview" />
                ) : (
                  <div className="profile-image-placeholder">
                    <FiUpload />
                    <span>Add Photo</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="profile-image-input"
              />
            </div>
          </div>

          {/* Business Title */}
          <div className="form-group">
            <label>Business Title *</label>
            <input
              type="text"
              name="businessTitle"
              value={formData.businessTitle}
              onChange={handleChange}
              required
              placeholder="Enter your business name"
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label>Business Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* License Verification */}
          {needsLicense && (
            <div className="license-section">
              <h3><FiFileText /> License Verification</h3>
              <div className="form-group">
                <label>License Number *</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required={needsLicense}
                  placeholder="Enter license number"
                />
              </div>
              <div className="form-group">
                <label>License Document *</label>
                <div className="file-upload">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    required={needsLicense}
                  />
                  <span className="file-hint">Upload PDF or Image</span>
                </div>
              </div>
              <div className="form-group">
                <label>Full Name (must match Clerk profile)</label>
                <input
                  type="text"
                  value={user?.fullName || ''}
                  disabled
                  className="disabled-input"
                />
              </div>
            </div>
          )}

          {formData.category === 'Home Stays' && (
            <div className="info-box">
              <p>Home Stays are automatically verified. No license required.</p>
            </div>
          )}

          {/* Regions */}
          <div className="form-group">
            <label><FiGlobe /> Available Regions *</label>
            {regionsLoading ? (
              <div className="loading-text">Loading regions...</div>
            ) : regions.length === 0 ? (
              <div className="error-text">
                No regions available
                <button 
                  type="button" 
                  className="btn-retry"
                  onClick={fetchRegions}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="regions-grid">
                {regions.map(region => (
                  <label key={region._id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.regions.includes(region.regionName)}
                      onChange={() => handleRegionToggle(region.regionName)}
                    />
                    <span>{region.regionName}</span>
                  </label>
                ))}
              </div>
            )}
            {formData.regions.length === 0 && !regionsLoading && regions.length > 0 && (
              <span className="validation-hint">Please select at least one region</span>
            )}
          </div>

          {/* Locations */}
          <div className="form-group">
            <label>Available Locations *</label>
            {formData.locations.map((location, index) => (
              <div key={index} className="location-card">
                <div className="location-header">
                  <span>Location {index + 1}</span>
                  {formData.locations.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeLocation(index)}
                    >
                      <FiMinus />
                    </button>
                  )}
                </div>
                <div className="location-fields">
                  <select
                    value={location.region}
                    onChange={(e) => handleLocationChange(index, 'region', e.target.value)}
                    required
                    disabled={formData.regions.length === 0}
                  >
                    <option value="">
                      {formData.regions.length === 0 ? 'Select regions first' : 'Select Region'}
                    </option>
                    {formData.regions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="City"
                    value={location.city}
                    onChange={(e) => handleLocationChange(index, 'city', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Area"
                    value={location.area}
                    onChange={(e) => handleLocationChange(index, 'area', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Place Name"
                    value={location.placeName}
                    onChange={(e) => handleLocationChange(index, 'placeName', e.target.value)}
                    required
                  />
                  <input
                    type="url"
                    placeholder="Google Maps Link (optional)"
                    value={location.mapLink}
                    onChange={(e) => handleLocationChange(index, 'mapLink', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <button type="button" className="btn-add" onClick={addLocation}>
              <FiPlus /> Add Location
            </button>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Business Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="5"
              placeholder="Describe your business, services, and experience..."
            />
          </div>

          {/* Contact Info */}
          <div className="form-group">
            <label>Contact Information</label>
            <div className="contact-fields">
              <div className="input-with-icon">
                <FiPhone />
                <input
                  type="tel"
                  name="phone"
                  value={formData.contactInfo.phone}
                  onChange={handleContactChange}
                  required
                  placeholder="Phone Number"
                />
              </div>
              <div className="input-with-icon">
                <FiPhone />
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.contactInfo.whatsapp}
                  onChange={handleContactChange}
                  placeholder="WhatsApp Number (optional)"
                />
              </div>
              <div className="input-with-icon">
                <FiMail />
                <input
                  type="email"
                  name="email"
                  value={formData.contactInfo.email}
                  onChange={handleContactChange}
                  required
                  placeholder="Email Address"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/profile')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Business'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateBusiness;
