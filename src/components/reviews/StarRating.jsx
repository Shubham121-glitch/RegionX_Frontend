import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import './starRating.css';

function StarRating({ rating, setRating, readOnly = false, size = 'medium' }) {
  const [hover, setHover] = useState(0);

  const handleClick = (value) => {
    if (!readOnly && setRating) {
      setRating(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readOnly) {
      setHover(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHover(0);
    }
  };

  return (
    <div className={`star-rating ${size} ${readOnly ? 'readonly' : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= (hover || rating) ? 'active' : ''}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          disabled={readOnly}
        >
          <FiStar className="star-icon" />
        </button>
      ))}
    </div>
  );
}

export default StarRating;
