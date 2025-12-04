import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ReviewForm from './ReviewForm';
import './BookDetail.css';

const BookDetail = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [diaryEntry, setDiaryEntry] = useState(null);
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useContext(AuthContext);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return (
      <>
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
        <span className="rating-number">({rating.toFixed(1)})</span>
      </>
    );
  };

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/books/${id}/`);
        setBook(response.data);
      } catch (error) {
        console.error('Error fetching book', error);
      }
    };
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/reviews/?book=${id}`);
        const bookReviews = response.data;
        // Reviews are now sorted by backend (most liked first)
        setReviews(bookReviews);
        if (user) {
          const myReview = bookReviews.find(review => review.user === user.username);
          setUserReview(myReview || null);
        }
        setLoadingReviews(false);
      } catch (error) {
        console.error('Error fetching reviews', error);
        setLoadingReviews(false);
      }
    };
    const fetchDiaryEntry = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/diary-entries/`);
        const entry = response.data.find(e => e.book.id === parseInt(id));
        if (entry) {
          setDiaryEntry(entry);
          setStatus(entry.status);
        } else {
          setDiaryEntry(null);
          setStatus(null);
        }
      } catch (error) {
        console.error('Error fetching diary entry', error);
        setDiaryEntry(null);
        setStatus(null);
      }
    };
    if (user) {
      fetchBook();
      fetchReviews();
      fetchDiaryEntry();
    }
  }, [id, user]);

  const handleReviewUpdate = async () => {
    // Re-fetch reviews and book data after review submission
    try {
      const [bookResponse, reviewsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/books/${id}/`),
        axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/reviews/?book=${id}`)
      ]);
      
      setBook(bookResponse.data);
      
      const bookReviews = reviewsResponse.data;
      // Reviews are now sorted by backend (most liked first)
      setReviews(bookReviews);
      if (user) {
        const myReview = bookReviews.find(review => review.user === user.username);
        setUserReview(myReview || null);
      }
    } catch (error) {
      console.error('Error updating reviews', error);
    }
  };

  const handleLikeReview = async (reviewId, isLiked) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };

      if (isLiked) {
        // Unlike: find and delete the like
        const likesResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/review-likes/`, config);
        const userLike = likesResponse.data.find(like => like.review.id === reviewId);
        if (userLike) {
          await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/review-likes/${userLike.id}/`, config);
        }
      } else {
        // Like: create a new like
        await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/review-likes/`, { review_id: reviewId }, config);
      }

      // Re-fetch reviews to ensure data is up to date
      const reviewsResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/reviews/?book=${id}`);
      const bookReviews = reviewsResponse.data;
      setReviews(bookReviews);
      if (user) {
        const myReview = bookReviews.find(review => review.user === user.username);
        setUserReview(myReview || null);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Failed to update like. Please try again.');
    }
  };

  const updateDiaryStatus = async (newStatus) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };

      const data = { status: newStatus };

      let response;
      if (diaryEntry) {
        // Update existing entry
        response = await axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/diary-entries/${diaryEntry.id}/`, data, config);
      } else {
        // Create new entry
        response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/diary-entries/`, { book_id: id, ...data }, config);
      }

      // Refresh diary entry data from server
      const refreshResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/diary-entries/`);
      const entry = refreshResponse.data.find(e => e.book.id === parseInt(id));
      if (entry) {
        setDiaryEntry(entry);
        setStatus(entry.status);
      } else {
        setDiaryEntry(null);
        setStatus(null);
      }
    } catch (error) {
      console.error('Error updating diary status:', error);
      alert('Error updating diary status. Please try again.');
    }
  };

  if (!user) return <p>Please login.</p>;
  if (!book) return <p>Loading...</p>;

  const reviewsCount = reviews.length + (userReview ? 1 : 0);

  return (
    <div className="book-detail-page">
      {/* Backdrop */}
      <div className="backdrop-container">
        <div className="backdrop-wrapper">
          <div className="backdrop-image" style={{
            backgroundImage: book.cover_url ? `url(${process.env.REACT_APP_API_BASE_URL}${book.cover_url})` : 'none',
            backgroundColor: book.cover_url ? 'transparent' : '#2d2d2d'
          }}></div>
          <div className="backdrop-mask"></div>
        </div>
      </div>

      <div className="content-wrap">
        <div className="cols-3 overflow">
          {/* Left Column - Poster and Stats */}
          <div className="col-6 gutter-right-1 col-poster-large">
            <section className="poster-list -p230 -single no-hover el col">
              <div className="poster-container">
                {book.cover_url ? (
                  <img
                    src={`${process.env.REACT_APP_API_BASE_URL}${book.cover_url}`}
                    alt={book.title}
                    className="book-poster"
                  />
                ) : (
                  <div className="no-image-poster">
                    <span>No Image</span>
                  </div>
                )}
              </div>

              {/* Statistics */}
              <div className="production-statistic-list">
                <div className="production-statistic -reviews">
                  <a href="#reviews" onClick={() => setActiveTab('reviews')}>
                    <svg xmlns="http://www.w3.org/2000/svg" role="presentation" className="glyph" width="16" height="11" viewBox="0 0 16 11">
                      <path fill="#000" fillRule="evenodd" d="M8.009 1c4.046 0 7.51 3.873 7.945 4.378l.04.048L16 5.6S12.324 10 7.991 10C3.945 10 .481 6.127.046 5.622L0 5.568V5.4S3.676 1 8.009 1ZM8 2.625a2.875 2.875 0 1 0 0 5.75 2.875 2.875 0 0 0 0-5.75ZM8 4.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z"></path>
                    </svg>
                    <span className="label">{reviewsCount}</span>
                  </a>
                </div>
                {book.average_rating && (
                  <div className="production-statistic -rating">
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" role="presentation" className="glyph" width="12" height="11" viewBox="0 0 12 11">
                        <path fill="#000" fillRule="evenodd" d="M6 2.25S4.51.5 2.99.5C1.46.5 0 1.23 0 3.37c0 1.52 1.5 2.86 1.5 2.86l3.812 3.617a1 1 0 0 0 1.376 0L10.5 6.23S12 4.89 12 3.37C12 1.23 10.54.5 9.01.5 7.49.5 6 2.25 6 2.25Z"></path>
                      </svg>
                      <span className="label">{book.average_rating.toFixed(1)}</span>
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Diary Status Panel */}
            <section className="diary-panel">
              <div className="header">
                <h3 className="title">Reading Status</h3>
              </div>
              <div className="diary-actions">
                <button
                  className={`diary-btn ${status === 'to-read' ? 'active' : ''}`}
                  onClick={() => { setStatus('to-read'); updateDiaryStatus('to-read'); }}
                >
                  To Read
                </button>
                <button
                  className={`diary-btn ${status === 'reading' ? 'active' : ''}`}
                  onClick={() => { setStatus('reading'); updateDiaryStatus('reading'); }}
                >
                  Reading
                </button>
                <button
                  className={`diary-btn ${status === 'read' ? 'active' : ''}`}
                  onClick={() => { setStatus('read'); updateDiaryStatus('read'); }}
                >
                  Read
                </button>
              </div>
            </section>
          </div>

          {/* Main Column */}
          <div className="col-17">
            <section className="production-masthead -shadowed -productionscreen -book">
              <div className="details">
                <h1 className="headline-1 primaryname">{book.title}</h1>
                <div className="productioninfo">
                  <span className="releasedate">
                    {book.publication_date ? new Date(book.publication_date).getFullYear() : ''}
                  </span>
                  <p className="credits">
                    <span className="introduction">By </span>
                    <span className="creatorlist">
                      {book.authors && book.authors.map((author, index) => (
                        <span key={author.id}>
                          <span className="creator">{author.name}</span>
                          {index < book.authors.length - 1 && ', '}
                        </span>
                      ))}
                    </span>
                  </p>
                </div>
              </div>
            </section>

            <section className="section col-10 col-main">
              <section className="production-synopsis">
                <div className="review body-text -prose -hero prettify">
                  <div className="truncate" data-truncate="450">
                    <p>{book.description}</p>
                  </div>
                </div>
              </section>

              {/* Tabs */}
              <div id="tabbed-content" data-selected-tab={activeTab}>
                <header>
                  <ul>
                    <li className={activeTab === 'overview' ? 'selected' : ''}>
                      <a href="#overview" onClick={() => setActiveTab('overview')}>Details</a>
                    </li>
                    <li className={activeTab === 'reviews' ? 'selected' : ''}>
                      <a href="#reviews" onClick={() => setActiveTab('reviews')}>Reviews</a>
                    </li>
                  </ul>
                </header>

                <div id="tab-overview" className={`tabbed-content-block ${activeTab === 'overview' ? '' : 'hidden'}`}>
                  <h3 className="hidden">Details</h3>
                  <div className="details-content">
                    <p><strong>Genre:</strong> {book.genre}</p>
                    <p><strong>Pages:</strong> {book.page_count}</p>
                    <p><strong>ISBN:</strong> {book.isbn}</p>
                    <p><strong>Publisher:</strong> {book.publisher ? book.publisher.name : ''}</p>
                    {book.average_rating && (
                      <p><strong>Average Rating:</strong> {renderStars(book.average_rating)}</p>
                    )}
                  </div>
                </div>

                <div id="tab-reviews" className={`tabbed-content-block ${activeTab === 'reviews' ? '' : 'hidden'}`}>
                  <h3 className="hidden">Reviews</h3>
                  <div className="reviews-section">
                    {reviews.length > 0 ? (
                      <div className="reviews-list">
                        {reviews.map(review => (
                          <article key={review.id} className={`review-card ${review.user === user?.username ? 'own-review' : ''}`}>
                            <div className="review-avatar">
                              <div className="avatar-placeholder">
                                {review.user.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="review-content">
                              <div className="review-attribution">
                                <div className="review-meta">
                                  <span className="review-author">
                                    {review.user === user?.username ? 'You' : review.user}
                                  </span>
                                  <span className="review-rating">
                                    {'★'.repeat(Math.floor(review.rating))}
                                    {(review.rating % 1 >= 0.5 ? '☆' : '')}
                                    {'☆'.repeat(5 - Math.floor(review.rating) - (review.rating % 1 >= 0.5 ? 1 : 0))}
                                    <span className="rating-value">({review.rating})</span>
                                  </span>
                                </div>
                              </div>
                              {review.text && (
                                <div className="review-body">
                                  <p className="review-text">{review.text}</p>
                                </div>
                              )}
                              <div className="review-actions">
                                <button
                                  className={`like-btn ${review.is_liked_by_user ? 'liked' : ''}`}
                                  onClick={() => handleLikeReview(review.id, review.is_liked_by_user)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                  </svg>
                                  <span className="like-count">{review.likes_count || 0}</span>
                                </button>
                                <span className="review-date">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="no-reviews">
                        <p>No reviews yet. Be the first to review this book!</p>
                      </div>
                    )}
                    <div className="review-form-section">
                      <ReviewForm
                        bookId={id}
                        existingReview={userReview}
                        loading={loadingReviews}
                        onReviewAdded={handleReviewUpdate}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;