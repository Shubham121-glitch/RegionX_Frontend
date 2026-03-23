import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiStar, FiSearch, FiArrowRight } from 'react-icons/fi';
import axios from 'axios';
import StarRating from '../../components/reviews/StarRating';
import Loading from '../../components/loading/Loading';
import './landing.css';

const monthlyRecommendations = {
  0: [ // January
    { name: 'Maldives', reason: 'Perfect beach weather', image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=300' },
    { name: 'Thailand', reason: 'Dry season begins', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=300' },
    { name: 'Switzerland', reason: 'Peak ski season', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=300' },
  ],
  1: [ // February
    { name: 'Maldives', reason: 'Perfect beach season', image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=300' },
    { name: 'Switzerland', reason: 'Snow landscapes', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=300' },
    { name: 'Japan', reason: 'Early cherry blossoms', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300' },
    { name: 'Brazil', reason: 'Carnival season', image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=300' },
  ],
  2: [ // March
    { name: 'Japan', reason: 'Cherry blossom season', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300' },
    { name: 'Morocco', reason: 'Pleasant temperatures', image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=300' },
    { name: 'New Zealand', reason: 'Autumn colors', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300' },
  ],
  3: [ // April
    { name: 'Netherlands', reason: 'Tulip season', image: 'https://images.unsplash.com/photo-1462275646964-a0e3f2f65b5f?w=300' },
    { name: 'Turkey', reason: 'Spring blooms', image: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=300' },
    { name: 'Peru', reason: 'Dry season begins', image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=300' },
  ],
  4: [ // May
    { name: 'Greece', reason: 'Perfect beach weather', image: 'https://images.unsplash.com/photo-1613395877344-13d4c79e4284?w=300' },
    { name: 'Italy', reason: 'Spring festivals', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=300' },
    { name: 'Indonesia', reason: 'Dry season starts', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300' },
  ],
  5: [ // June
    { name: 'Iceland', reason: 'Midnight sun', image: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=300' },
    { name: 'Norway', reason: 'Fjord season', image: 'https://images.unsplash.com/photo-1506701169896-2303b922fa55?w=300' },
    { name: 'Canada', reason: 'Wildlife viewing', image: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=300' },
  ],
  6: [ // July
    { name: 'France', reason: 'Summer festivals', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300' },
    { name: 'Spain', reason: 'Beach season', image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=300' },
    { name: 'Croatia', reason: 'Island hopping', image: 'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=300' },
  ],
  7: [ // August
    { name: 'Scotland', reason: 'Edinburgh Festival', image: 'https://images.unsplash.com/photo-1506377585622-bedcbb027afc?w=300' },
    { name: 'Kenya', reason: 'Great migration', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=300' },
    { name: 'Indonesia', reason: 'Peak dry season', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300' },
  ],
  8: [ // September
    { name: 'Germany', reason: 'Oktoberfest', image: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=300' },
    { name: 'Portugal', reason: 'Wine harvest', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=300' },
    { name: 'USA', reason: 'Fall foliage begins', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300' },
  ],
  9: [ // October
    { name: 'Mexico', reason: 'Day of the Dead', image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=300' },
    { name: 'Vietnam', reason: 'Pleasant weather', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=300' },
    { name: 'Egypt', reason: 'Cooler temperatures', image: 'https://images.unsplash.com/photo-1539650116455-251d9a063595?w=300' },
  ],
  10: [ // November
    { name: 'India', reason: 'Diwali celebrations', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=300' },
    { name: 'Morocco', reason: 'Desert trekking', image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=300' },
    { name: 'Argentina', reason: 'Spring season', image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=300' },
  ],
  11: [ // December
    { name: 'Austria', reason: 'Christmas markets', image: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=300' },
    { name: 'Finland', reason: 'Northern lights', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=300' },
    { name: 'Australia', reason: 'Summer begins', image: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=300' },
  ],
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function Landing() {
  const navigate = useNavigate();
  const [currentMonth] = useState(new Date().getMonth());
  const [recommendations, setRecommendations] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch regions from backend
  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const response = await axios.get(`${API_URL}/regions`);
      setRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRecommendations(monthlyRecommendations[currentMonth] || []);
  }, [currentMonth]);

  const handleRegionClick = (regionId) => {
    navigate(`/region/${regionId}`);
  };

  const filteredRegions = regions.filter(region =>
    (region.regionName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (region.shortDescription || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="landing-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <h1 className="dashboard-title">Explore Regions</h1>
          <p className="dashboard-subtitle">Discover amazing destinations around the world.</p>
        </div>
        
        <div className="dashboard-search">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search regions, cities..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Featured/Recommendations Section */}
      <section className="dashboard-section" id="explore">
        <div className="section-header">
          <h2 className="section-title">Top picks for {monthNames[currentMonth]}</h2>
        </div>
        
        <div className="recommendations-card-grid">
          {recommendations.map((rec, idx) => (
            <div className="rec-card" key={idx}>
              <div className="rec-image-wrapper">
                <img src={rec.image} alt={rec.name} className="rec-image" />
                <div className="rec-overlay">
                  <span className="rec-badge">Featured</span>
                </div>
              </div>
              <div className="rec-info">
                <h3>{rec.name}</h3>
                <p>{rec.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Regions Grid Section */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">All Regions</h2>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="regions-card-grid">
              {filteredRegions.map((region) => (
                <div 
                  key={region._id} 
                  className="region-modern-card"
                  onClick={() => handleRegionClick(region._id)}
                >
                  <div className="region-img-container">
                    <img src={`${BASE_URL}${region.thumbnail}`} alt={region.regionName} loading="lazy" />
                    
                    <div className="region-overlay-actions">
                      <button className="overlay-btn favorite"><FiHeart /></button>
                    </div>

                    {region.totalReviews > 0 && (
                      <div className="region-rating-pill">
                        <FiStar className="star-icon" />
                        <span>{parseFloat(region.averageRating).toFixed(1)}</span>
                        <span className="review-count">({region.totalReviews})</span>
                      </div>
                    )}
                  </div>

                  <div className="region-card-content">
                    <div className="region-meta">
                      <span className="region-tag"><FiMapPin size={12}/> {region.regionName}</span>
                    </div>
                    <h3 className="region-card-title">{region.regionName}</h3>
                    <p className="region-card-desc">{region.shortDescription}</p>
                    
                    <div className="region-card-footer">
                      <span className="explore-text">Explore now</span>
                      <FiArrowRight className="arrow-icon" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredRegions.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon"><FiSearch size={32} /></div>
                <h3>No regions found</h3>
                <p>We couldn't find any regions matching "{searchQuery}". Try a different search term.</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default Landing;
