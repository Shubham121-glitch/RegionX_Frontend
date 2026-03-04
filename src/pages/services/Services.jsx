import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  FiMapPin, 
  FiSearch, 
  FiCrosshair, 
  FiCheckCircle, 
  FiClock, 
  FiPhone, 
  FiMail,
  FiArrowRight,
  FiBriefcase,
  FiNavigation
} from 'react-icons/fi';
import Loading from '../../components/loading/Loading';
import './services.css';

const categories = [
  'Guide',
  'Medical',
  'Restaurants',
  'Home Stays',
  'Travel and Transport'
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

function Services() {
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const [regions, setRegions] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Filter states
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Fetch regions on mount
  useEffect(() => {
    fetchRegions();
    fetchServices(); // Fetch all services initially
  }, []);

  // Fetch services when filters change
  useEffect(() => {
    fetchServices();
  }, [selectedRegion, selectedCategory]);

  const fetchRegions = async () => {
    try {
      const response = await axios.get(`${API_URL}/regions`);
      setRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (selectedRegion) params.region = selectedRegion;
      if (selectedCategory) params.category = selectedCategory;
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }

      const response = await axios.get(`${API_URL}/services`, { params });
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationLoading(false);
        // Fetch services with location
        fetchServicesByLocation(latitude, longitude);
      },
      (error) => {
        setLocationError('Unable to retrieve your location');
        setLocationLoading(false);
        console.error('Geolocation error:', error);
      }
    );
  };

  const fetchServicesByLocation = async (lat, lng) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/services`, {
        params: { lat, lng }
      });
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services by location:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = () => {
    setUserLocation(null);
    setLocationError(null);
    fetchServices();
  };

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'Verified':
        return <span className="verify-badge verified"><FiCheckCircle /> Verified</span>;
      case 'Pending Verification':
        return <span className="verify-badge pending"><FiClock /> Pending</span>;
      default:
        return null;
    }
  };

  const handleContact = (service) => {
    if (!isSignedIn) {
      navigate('/sign-in');
      return;
    }
    // Navigate to chat
    navigate(`/chat/${service._id}`);
  };

  return (
    <div className="services-page">
      {/* Page Header */}
      <section className="services-header">
        <div className="services-header-content">
          <h1 className="services-title">
            <FiBriefcase /> Services
          </h1>
          <p className="services-subtitle">
            Discover local businesses and services across regions
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="filters-section">
        <div className="filters-container">
          <div className="filters-row">
            {/* Region Dropdown */}
            <div className="filter-group">
              <label className="filter-label">
                <FiMapPin /> Region
              </label>
              <select 
                value={selectedRegion} 
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="filter-select"
              >
                <option value="">All Regions</option>
                {regions.map(region => (
                  <option key={region._id} value={region._id}>
                    {region.regionName}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="filter-group">
              <label className="filter-label">
                <FiBriefcase /> Category
              </label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Button */}
            <div className="filter-group">
              <label className="filter-label">
                <FiNavigation /> Location
              </label>
              {userLocation ? (
                <button 
                  className="location-btn active"
                  onClick={clearLocation}
                >
                  <FiCrosshair /> Location Active
                </button>
              ) : (
                <button 
                  className="location-btn"
                  onClick={useCurrentLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <><span className="spinner"></span> Getting Location...</>
                  ) : (
                    <><FiCrosshair /> Use My Location</>
                  )}
                </button>
              )}
            </div>

            {/* Search Button */}
            <div className="filter-group">
              <label className="filter-label">
                <FiSearch /> Search
              </label>
              <button 
                className="search-btn"
                onClick={fetchServices}
              >
                <FiSearch /> Find Services
              </button>
            </div>
          </div>

          {/* Location Error */}
          {locationError && (
            <div className="location-error">
              {locationError}
            </div>
          )}

          {/* Active Filters */}
          {(selectedRegion || selectedCategory || userLocation) && (
            <div className="active-filters">
              <span className="filters-label">Active Filters:</span>
              {selectedRegion && (
                <span className="filter-tag">
                  Region: {regions.find(r => r._id === selectedRegion)?.regionName}
                  <button onClick={() => setSelectedRegion('')}>×</button>
                </span>
              )}
              {selectedCategory && (
                <span className="filter-tag">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('')}>×</button>
                </span>
              )}
              {userLocation && (
                <span className="filter-tag location-tag">
                  <FiCrosshair /> Near Me
                  <button onClick={clearLocation}>×</button>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Services List */}
      <section className="services-list-section">
        <div className="services-container">
          {/* Results Count */}
          <div className="results-header">
            <h2 className="results-title">
              {loading ? 'Searching...' : `${services.length} Service${services.length !== 1 ? 's' : ''} Found`}
            </h2>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="services-loading">
              <Loading />
            </div>
          ) : (
            <>
              {/* Services Grid */}
              {services.length > 0 ? (
                <div className="services-grid">
                  {services.map(service => (
                    <div key={service._id} className="service-card">
                      {/* Card Header */}
                      <div className="service-card-header">
                        <div className="service-category-badge">
                          {service.category}
                        </div>
                        {getVerificationBadge(service.verificationStatus)}
                      </div>

                      {/* Card Content */}
                      <div className="service-card-content">
                        <h3 className="service-title">{service.businessTitle}</h3>
                        
                        <div className="service-regions">
                          <FiMapPin />
                          <span>
                            {service.regions?.map(r => 
                              typeof r === 'object' ? r.regionName : r
                            ).join(', ') || 'All Regions'}
                          </span>
                        </div>

                        <p className="service-description">
                          {service.description?.substring(0, 120)}
                          {service.description?.length > 120 ? '...' : ''}
                        </p>

                        {/* Locations */}
                        {service.locations && service.locations.length > 0 && (
                          <div className="service-locations">
                            <span className="locations-label">Locations:</span>
                            <span className="locations-list">
                              {service.locations.slice(0, 3).map(loc => loc.placeName || loc.area || loc.city).join(', ')}
                              {service.locations.length > 3 && ` +${service.locations.length - 3} more`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="service-card-actions">
                        <button 
                          className="btn-contact"
                          onClick={() => handleContact(service)}
                        >
                          <FiMail />
                          Message
                        </button>
                        <button 
                          className="btn-view"
                          onClick={() => navigate(`/business/${service._id}`)}
                        >
                          View Profile <FiArrowRight />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="services-empty">
                  <FiBriefcase className="empty-icon" />
                  <h3>No Services Found</h3>
                  <p>Try adjusting your filters or search criteria</p>
                  <button 
                    className="btn-clear-filters"
                    onClick={() => {
                      setSelectedRegion('');
                      setSelectedCategory('');
                      setUserLocation(null);
                    }}
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Services;
