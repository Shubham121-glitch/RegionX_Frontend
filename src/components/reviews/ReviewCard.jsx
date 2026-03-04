import { useState, useEffect } from 'react';
import { FiTrash2, FiEdit2, FiX, FiCheck, FiThumbsUp, FiThumbsDown, FiMessageSquare } from 'react-icons/fi';
import { useUser, useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import StarRating from './StarRating';
import './reviewCard.css';

function ReviewCard({ review, onDelete, onUpdate, isBusinessOwner = false }) {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editComment, setEditComment] = useState(review.comment);
  const [loading, setLoading] = useState(false);
  
  // Reply states
  const [replyText, setReplyText] = useState(review.reply?.text || '');
  const [isReplying, setIsReplying] = useState(false);
  const [isEditingReply, setIsEditingReply] = useState(false);
  
  // Voting states
  const [helpfulVotes, setHelpfulVotes] = useState(review.helpfulVotes || 0);
  const [notHelpfulVotes, setNotHelpfulVotes] = useState(review.notHelpfulVotes || 0);
  const [userVote, setUserVote] = useState(null);
  const [voteLoading, setVoteLoading] = useState(false);

  const isOwner = isSignedIn && user?.id === review.userId;
  const hasReply = review.reply && review.reply.text;
  
  // Check user's vote status on mount
  useEffect(() => {
    if (isSignedIn) {
      checkUserVote();
    }
  }, [isSignedIn]);
  
  const checkUserVote = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `http://localhost:5000/api/reviews/${review._id}/vote-status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserVote(response.data.voteType);
    } catch (error) {
      console.error('Error checking vote status:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/reviews/${review._id}`, {
        data: { userId: user.id }
      });
      onDelete(review._id);
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleSaveEdit = async () => {
    if (!editComment.trim()) return;

    setLoading(true);
    try {
      const response = await axios.put(`http://localhost:5000/api/reviews/${review._id}`, {
        userId: user.id,
        rating: editRating,
        comment: editComment
      });
      onUpdate(review._id, response.data.review);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    if (!isSignedIn) return;
    if (voteLoading) return;
    
    setVoteLoading(true);
    try {
      const token = await getToken();
      const response = await axios.post(
        `http://localhost:5000/api/reviews/${review._id}/vote`,
        { voteType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setHelpfulVotes(response.data.review.helpfulVotes);
      setNotHelpfulVotes(response.data.review.notHelpfulVotes);
      setUserVote(response.data.review.userVote);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoteLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.post(
        `http://localhost:5000/api/reviews/${review._id}/reply`,
        { text: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setReplyText(response.data.review.reply.text);
      setIsReplying(false);
      onUpdate(review._id, response.data.review);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditReply = async () => {
    if (!replyText.trim()) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.put(
        `http://localhost:5000/api/reviews/${review._id}/reply`,
        { text: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setReplyText(response.data.review.reply.text);
      setIsEditingReply(false);
      onUpdate(review._id, response.data.review);
    } catch (error) {
      console.error('Error editing reply:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    
    try {
      const token = await getToken();
      await axios.delete(
        `http://localhost:5000/api/reviews/${review._id}/reply`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setReplyText('');
      onUpdate(review._id, { ...review, reply: { text: '', repliedBy: '', repliedAt: null } });
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">
            {review.userImage ? (
              <img src={review.userImage} alt={review.username} />
            ) : (
              <div className="avatar-placeholder">
                {review.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="reviewer-details">
            <div className="reviewer-name-row">
              <h4 className="reviewer-name">{review.username}</h4>
              {hasReply && (
                <span className="reply-badge" title="Business has replied to this review">
                  <FiMessageSquare /> Replied
                </span>
              )}
            </div>
            <span className="review-date">{formatDate(review.createdAt)}</span>
            {review.updatedAt !== review.createdAt && (
              <span className="edited-tag">(edited)</span>
            )}
          </div>
        </div>

        {isOwner && !isEditing && (
          <div className="review-actions-owner">
            <button onClick={handleEdit} className="action-btn edit-btn" title="Edit">
              <FiEdit2 />
            </button>
            <button onClick={handleDelete} className="action-btn delete-btn" title="Delete">
              <FiTrash2 />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="edit-form">
          <StarRating rating={editRating} setRating={setEditRating} size="medium" />
          <textarea
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            rows="3"
            className="edit-textarea"
          />
          <div className="edit-actions">
            <button onClick={handleCancelEdit} className="btn-cancel">
              <FiX /> Cancel
            </button>
            <button 
              onClick={handleSaveEdit} 
              className="btn-save"
              disabled={loading}
            >
              {loading ? 'Saving...' : <><FiCheck /> Save</>}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="review-rating">
            <StarRating rating={review.rating} readOnly size="small" />
          </div>

          <p className="review-comment">{review.comment}</p>

          {review.image && (
            <div className="review-media">
              <img 
                src={`http://localhost:5000${review.image}`} 
                alt="Review" 
                className="review-image"
              />
            </div>
          )}

          {review.video && (
            <div className="review-media">
              <video 
                src={`http://localhost:5000${review.video}`} 
                controls
                className="review-video"
              />
            </div>
          )}

          {/* Voting Section */}
          <div className="review-voting">
            <button 
              className={`vote-btn ${userVote === 'helpful' ? 'active' : ''}`}
              onClick={() => handleVote('helpful')}
              disabled={voteLoading}
            >
              <FiThumbsUp /> Helpful ({helpfulVotes})
            </button>
            <button 
              className={`vote-btn ${userVote === 'notHelpful' ? 'active' : ''}`}
              onClick={() => handleVote('notHelpful')}
              disabled={voteLoading}
            >
              <FiThumbsDown /> Not Helpful ({notHelpfulVotes})
            </button>
          </div>

          {/* Reply Section */}
          {hasReply && (
            <div className="review-reply">
              <div className="reply-header">
                <FiMessageSquare className="reply-icon" />
                <span className="reply-label">Business Reply</span>
                <span className="reply-date">
                  {review.reply.repliedAt && formatDate(review.reply.repliedAt)}
                </span>
              </div>
              
              {isEditingReply ? (
                <div className="reply-edit-form">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows="3"
                    className="reply-textarea"
                    placeholder="Write your reply..."
                  />
                  <div className="reply-edit-actions">
                    <button 
                      onClick={() => { setIsEditingReply(false); setReplyText(review.reply.text); }}
                      className="btn-cancel"
                    >
                      <FiX /> Cancel
                    </button>
                    <button 
                      onClick={handleEditReply}
                      className="btn-save"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : <><FiCheck /> Save</>}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="reply-text">{review.reply.text}</p>
                  {isBusinessOwner && review.reply.repliedBy === user?.id && (
                    <div className="reply-actions">
                      <button 
                        onClick={() => setIsEditingReply(true)}
                        className="action-btn edit-btn"
                        title="Edit Reply"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        onClick={handleDeleteReply}
                        className="action-btn delete-btn"
                        title="Delete Reply"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Business Owner Reply Form */}
          {isBusinessOwner && !hasReply && !isReplying && (
            <button 
              className="btn-reply"
              onClick={() => setIsReplying(true)}
            >
              <FiMessageSquare /> Reply to Review
            </button>
          )}

          {isBusinessOwner && isReplying && (
            <div className="reply-form">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows="3"
                className="reply-textarea"
                placeholder="Write your reply as a business owner..."
              />
              <div className="reply-form-actions">
                <button 
                  onClick={() => { setIsReplying(false); setReplyText(''); }}
                  className="btn-cancel"
                >
                  <FiX /> Cancel
                </button>
                <button 
                  onClick={handleSubmitReply}
                  className="btn-save"
                  disabled={loading || !replyText.trim()}
                >
                  {loading ? 'Posting...' : <><FiCheck /> Post Reply</>}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReviewCard;
