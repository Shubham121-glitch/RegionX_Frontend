import React, { useState, useEffect } from 'react';
import { getStaticMapUrl, downloadStaticMap } from '../../utils/imageHelpers';

const SaazReligiousPlaces = ({ onClose }) => {
  const [location, setLocation] = useState('');
  const [religiousPlaces, setReligiousPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock data for religious places
  const mockReligiousPlaces = [
    {
      id: 1,
      name: 'Sacred Temple',
      type: 'Temple',
      distance: '0.5 km',
      rating: 4.8,
      address: '123 Holy Street',
      description: 'Ancient temple with beautiful architecture'
    },
    {
      id: 2,
      name: 'Peaceful Church',
      type: 'Church',
      distance: '1.2 km',
      rating: 4.6,
      address: '456 Faith Avenue',
      description: 'Historic church with stunning stained glass windows'
    },
    {
      id: 3,
      name: 'Tranquil Mosque',
      type: 'Mosque',
      distance: '0.8 km',
      rating: 4.9,
      address: '789 Prayer Lane',
      description: 'Beautiful mosque with peaceful courtyard'
    },
    {
      id: 4,
      name: 'Serene Gurdwara',
      type: 'Gurdwara',
      distance: '1.5 km',
      rating: 4.7,
      address: '321 Harmony Road',
      description: 'Welcoming gurdwara with community kitchen'
    }
  ];

  const searchReligiousPlaces = () => {
    if (!location.trim()) return;
    
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setReligiousPlaces(mockReligiousPlaces);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    // Simulate initial search for current location
    setLoading(true);
    setTimeout(() => {
      setReligiousPlaces(mockReligiousPlaces);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="saaz-modal-overlay" onClick={onClose}>
      <div className="saaz-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="saaz-modal-header">
          <h2>⛪ Religious Places</h2>
          <button className="saaz-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="saaz-religious-places-content">
          <div className="saaz-location-search">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location or use current location"
              className="saaz-location-input"
            />
            <button 
              className="saaz-search-btn" 
              onClick={searchReligiousPlaces}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button className="saaz-current-location-btn">📍 Use Current Location</button>
          </div>
          
          <div className="saaz-religious-places-list">
            {loading ? (
              <div className="saaz-loading">Finding nearby religious places...</div>
            ) : (
              religiousPlaces.map(place => (
                <div key={place.id} className="saaz-religious-place-card">
                  <div className="saaz-place-header">
                    <h3>{place.name}</h3>
                    <span className={`saaz-place-type saaz-${place.type.toLowerCase()}`}>{place.type}</span>
                  </div>
                  <div className="saaz-place-details">
                    <p><strong>Distance:</strong> {place.distance}</p>
                    <p><strong>Rating:</strong> ⭐ {place.rating}</p>
                    <p><strong>Address:</strong> {place.address}</p>
                    <p>{place.description}</p>
                  </div>
                  <div className="saaz-place-actions">
                    <button className="saaz-directions-btn">🗺️ Directions</button>
                    <button className="saaz-favorite-btn">❤️ Favorite</button>
                    <button
                      className="saaz-download-btn"
                      onClick={async () => {
                        const markers = [{ query: place.address || place.name }];
                        if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
                          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address || place.name)}`, '_blank');
                          return;
                        }
                        try {
                          await downloadStaticMap({ markers, size: '1200x800', filename: `${(place.name || 'map').replace(/\s+/g, '_')}.png` });
                        } catch (err) {
                          console.error('Download map failed', err);
                          const url = getStaticMapUrl({ markers, size: '1200x800' });
                          if (url) window.open(url, '_blank');
                        }
                      }}
                    >
                      ⬇️ Download map
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="saaz-religious-tips">
            <h4>Visiting Religious Sites:</h4>
            <ul>
              <li>Dress modestly and respectfully</li>
              <li>Remove shoes if required</li>
              <li>Be quiet and respectful during prayers</li>
              <li>Ask permission before taking photos</li>
              <li>Learn about local customs beforehand</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaazReligiousPlaces;