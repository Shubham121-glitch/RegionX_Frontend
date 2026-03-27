import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { FiCamera, FiVideo, FiX, FiSend } from 'react-icons/fi';
import axios from 'axios';
import StarRating from './StarRating';
import './reviewForm.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ReviewForm({ regionId, onReviewAdded }) {
  const { user, isSignedIn } = useUser();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleVideoChange = (e) => {
    if (e.target.files[0]) {
      // Check video duration (30 seconds max)
      const file = e.target.files[0];
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 30) {
          setError('Video must be 30 seconds or less');
          setVideo(null);
        } else {
          setError('');
          setVideo(file);
        }
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const removeImage = () => setImage(null);
  const removeVideo = () => setVideo(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      setError('Please sign in to leave a review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please write a review');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('regionId', regionId);
      formData.append('userId', user.id);
      formData.append('username', user.fullName || user.username || 'Anonymous');
      formData.append('userImage', user.imageUrl || '');
      formData.append('rating', rating);
      formData.append('comment', comment);

      if (image) {
        formData.append('image', image);
      }
      if (video) {
        formData.append('video', video);
      }

      const response = await axios.post(`${API_URL}/reviews`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Reset form
      setRating(0);
      setComment('');
      setImage(null);
      setVideo(null);

      // Notify parent
      if (onReviewAdded) {
        onReviewAdded(response.data.review);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="review-form-container">
        <div className="sign-in-prompt">
          <p>Please sign in to leave a review</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-form-container">
      <h3 className="review-form-title">Write a Review</h3>
      
      {error && (
        <div className="review-error">
          <FiX /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="review-form">
        {/* Star Rating */}
        <div className="form-group rating-group">
          <StarRating rating={rating} setRating={setRating} size="large" />
        </div>

        {/* Review Text */}
        <div className="form-group">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a review..."
            required
          />
        </div>

        {/* Media Upload */}
        <div className="form-group media-upload-group">
          <div className="media-uploads">
            {/* Image Upload */}
            <div className="media-upload-item">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                id="review-image"
                hidden
              />
              <label htmlFor="review-image" className="media-upload-btn" title="Add Photo">
                <FiCamera />
              </label>
              {image && (
                <div className="media-preview">
                  <span className="media-name">{image.name}</span>
                  <button type="button" onClick={removeImage} className="remove-media">
                    <FiX />
                  </button>
                </div>
              )}
            </div>

            {/* Video Upload */}
            <div className="media-upload-item">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                id="review-video"
                hidden
              />
              <label htmlFor="review-video" className="media-upload-btn" title="Add Video">
                <FiVideo />
              </label>
              {video && (
                <div className="media-preview">
                  <span className="media-name">{video.name}</span>
                  <button type="button" onClick={removeVideo} className="remove-media">
                    <FiX />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className={`submit-review-btn ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? (
            <span className="spinner"></span>
          ) : (
            'Post'
          )}
        </button>
      </form>
    </div>
  );
}

export default ReviewForm;
