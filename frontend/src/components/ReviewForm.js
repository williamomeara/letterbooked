import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const ReviewForm = ({ bookId, existingReview, loading, onReviewAdded }) => {
  const [rating, setRating] = useState(5.0);
  const [hoverRating, setHoverRating] = useState(null);
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setText(existingReview.text);
    }
  }, [existingReview]);

  const renderRatingStars = (r) => {
    const full = Math.floor(r);
    const hasHalf = r % 1 >= 0.5;
    const empty = 5 - full - (hasHalf ? 1 : 0);
    return (
      <>
        {'★'.repeat(full)}
        {hasHalf && <span style={{ opacity: 0.5 }}>★</span>}
        {'☆'.repeat(empty)}
      </>
    );
  };

  const handleStarClick = (star, half) => {
    setRating(star + (half ? 0.5 : 0));
  };

  const renderStars = () => {
    const currentRating = hoverRating !== null ? hoverRating : rating;
    return [1, 2, 3, 4, 5].map(star => {
      const isFull = currentRating >= star;
      const isHalf = currentRating >= star - 0.5 && currentRating < star;
      return (
        <span key={star} style={{ position: 'relative', display: 'inline-block', fontSize: '24px' }} onMouseLeave={() => setHoverRating(null)}>
          <span
            style={{ cursor: 'pointer', position: 'absolute', left: 0, width: '50%', height: '100%', zIndex: 2 }}
            onMouseEnter={() => setHoverRating(star - 0.5)}
            onClick={() => handleStarClick(star - 1, true)}
          ></span>
          <span
            style={{ cursor: 'pointer', position: 'absolute', right: 0, width: '50%', height: '100%', zIndex: 2 }}
            onMouseEnter={() => setHoverRating(star)}
            onClick={() => handleStarClick(star, false)}
          ></span>
          <span style={{ position: 'relative', zIndex: 1, opacity: isHalf ? 0.5 : 1 }}>
            {isFull || isHalf ? '★' : '☆'}
          </span>
        </span>
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      if (existingReview) {
        await axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/reviews/${existingReview.id}/`, { rating, text }, config);
        setIsEditing(false); // Return to read-only mode after successful edit
      } else {
        await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/reviews/`, { book_id: bookId, rating, text }, config);
      }
      onReviewAdded();
    } catch (error) {
      alert('Error saving review');
    }
  };

  if (existingReview && !isEditing) {
    return (
      <div className="mb-3">
        <p><em>Your review appears in the reviews list above.</em></p>
        <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>Edit Your Review</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label>Rating</label>
        <div>{renderStars()}</div>
        <small>Current rating: {rating}</small>
      </div>
      <div className="mb-3">
        <label>Review</label>
        <textarea className="form-control" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <button type="submit" className="btn btn-success" disabled={loading}>{existingReview ? 'Update Review' : 'Submit Review'}</button>
      {existingReview && <button type="button" className="btn btn-secondary ms-2" onClick={() => setIsEditing(false)}>Cancel</button>}
    </form>
  );
};

export default ReviewForm;