import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUpload, FiPlus, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import './adminUpload.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function AdminUpload() {
  const [formData, setFormData] = useState({
    regionName: '',
    shortDescription: '',
    detailedDescription: '',
    history: '',
    culturalValues: '',
    traditions: ''
  });
  
  const [thumbnail, setThumbnail] = useState(null);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [places, setPlaces] = useState([{ name: '', description: '', image: null }]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Add class to body for navbar styling
  useEffect(() => {
    document.body.classList.add('admin-upload-page');
    return () => {
      document.body.classList.remove('admin-upload-page');
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e) => {
    if (e.target.files[0]) {
      setThumbnail(e.target.files[0]);
    }
  };

  const handleImagesChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleVideosChange = (e) => {
    setVideos(Array.from(e.target.files));
  };

  const handlePlaceChange = (index, field, value) => {
    const newPlaces = [...places];
    newPlaces[index][field] = value;
    setPlaces(newPlaces);
  };

  const handlePlaceImageChange = (index, file) => {
    const newPlaces = [...places];
    newPlaces[index].image = file;
    setPlaces(newPlaces);
  };

  const addPlace = () => {
    setPlaces([...places, { name: '', description: '', image: null }]);
  };

  const removePlace = (index) => {
    setPlaces(places.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      
      // Append thumbnail
      if (thumbnail) {
        data.append('thumbnail', thumbnail);
      }
      
      // Append images
      images.forEach(image => {
        data.append('images', image);
      });
      
      // Append videos
      videos.forEach(video => {
        data.append('videos', video);
      });
      
      // Append places data (without images)
      const placesData = places.map(p => ({ name: p.name, description: p.description }));
      data.append('placesToVisit', JSON.stringify(placesData));
      
      // Append place images
      places.forEach(place => {
        if (place.image) {
          data.append('placeImages', place.image);
        }
      });

      const response = await axios.post(`${API_URL}/regions`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ type: 'success', text: 'Region uploaded successfully!' });
      
      // Reset form
      setFormData({
        regionName: '',
        shortDescription: '',
        detailedDescription: '',
        history: '',
        culturalValues: '',
        traditions: ''
      });
      setThumbnail(null);
      setImages([]);
      setVideos([]);
      setPlaces([{ name: '', description: '', image: null }]);
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error uploading region. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-upload-container">
      <div className="admin-upload-wrapper">
        <h1 className="admin-title">Upload New Region</h1>
        
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? <FiCheck /> : <FiX />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          {/* Basic Information */}
          <section className="form-section">
            <h2 className="section-title">Basic Information</h2>
            
            <div className="form-group">
              <label>Region Name *</label>
              <input
                type="text"
                name="regionName"
                value={formData.regionName}
                onChange={handleInputChange}
                placeholder="e.g., Europe"
                required
              />
            </div>

            <div className="form-group">
              <label>Short Description *</label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                placeholder="Brief description for cards..."
                rows="2"
                required
              />
            </div>

            <div className="form-group">
              <label>Detailed Description *</label>
              <textarea
                name="detailedDescription"
                value={formData.detailedDescription}
                onChange={handleInputChange}
                placeholder="Full description of the region..."
                rows="5"
                required
              />
            </div>
          </section>

          {/* Media Upload */}
          <section className="form-section">
            <h2 className="section-title">Media</h2>
            
            <div className="form-group">
              <label>Thumbnail Image *</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  required
                />
                <div className="file-input-display">
                  <FiUpload />
                  {thumbnail ? thumbnail.name : 'Choose thumbnail...'}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Gallery Images (up to 10)</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                />
                <div className="file-input-display">
                  <FiUpload />
                  {images.length > 0 ? `${images.length} images selected` : 'Choose images...'}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Videos (optional)</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideosChange}
                />
                <div className="file-input-display">
                  <FiUpload />
                  {videos.length > 0 ? `${videos.length} videos selected` : 'Choose videos...'}
                </div>
              </div>
            </div>
          </section>

          {/* Culture & History */}
          <section className="form-section">
            <h2 className="section-title">Culture & History</h2>
            
            <div className="form-group">
              <label>History *</label>
              <textarea
                name="history"
                value={formData.history}
                onChange={handleInputChange}
                placeholder="Historical background..."
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>Cultural Values *</label>
              <textarea
                name="culturalValues"
                value={formData.culturalValues}
                onChange={handleInputChange}
                placeholder="Cultural values and traditions..."
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>Traditions *</label>
              <textarea
                name="traditions"
                value={formData.traditions}
                onChange={handleInputChange}
                placeholder="Local traditions and customs..."
                rows="4"
                required
              />
            </div>
          </section>

          {/* Places to Visit */}
          <section className="form-section">
            <h2 className="section-title">Places to Visit</h2>
            
            {places.map((place, index) => (
              <div key={index} className="place-form-card">
                <div className="place-form-header">
                  <h3>Place #{index + 1}</h3>
                  {places.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removePlace(index)}
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Place Name</label>
                  <input
                    type="text"
                    value={place.name}
                    onChange={(e) => handlePlaceChange(index, 'name', e.target.value)}
                    placeholder="e.g., Eiffel Tower"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={place.description}
                    onChange={(e) => handlePlaceChange(index, 'description', e.target.value)}
                    placeholder="Describe this place..."
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Place Image</label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePlaceImageChange(index, e.target.files[0])}
                    />
                    <div className="file-input-display">
                      <FiUpload />
                      {place.image ? place.image.name : 'Choose image...'}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="btn-add-place" onClick={addPlace}>
              <FiPlus /> Add Another Place
            </button>
          </section>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload Region'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminUpload;
