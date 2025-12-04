import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './BookList.css';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 28;
  const [hoveredBook, setHoveredBook] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [isHoveringPopup, setIsHoveringPopup] = useState(false);
  const [quickHoverRating, setQuickHoverRating] = useState(null);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const { user, token } = useContext(AuthContext);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return (
      <>
        {'★'.repeat(fullStars)}
        {hasHalfStar && <span style={{ opacity: 0.5 }}>★</span>}
        {'☆'.repeat(emptyStars)}
      </>
    );
  };

  const handleMouseEnter = (book) => {
    clearTimeout(hoverTimeout);
    setHoveredBook(book);
  };

  const handleMouseLeave = () => {
    if (!isHoveringPopup) {
      clearTimeout(hoverTimeout);
      const timeout = setTimeout(() => setHoveredBook(null), 200);
      setHoverTimeout(timeout);
    }
  };

  const handlePopupMouseEnter = () => {
    clearTimeout(hoverTimeout);
    setIsHoveringPopup(true);
  };

  const handlePopupMouseLeave = () => {
    setIsHoveringPopup(false);
    const timeout = setTimeout(() => setHoveredBook(null), 200);
    setHoverTimeout(timeout);
  };

  const handleQuickRating = async (bookId, rating) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const existingReview = (userReviews || []).find(review => review.book_id === parseInt(bookId));
      if (existingReview) {
        await axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/reviews/${existingReview.id}/`, { rating, text: '' }, config);
      } else {
        await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/reviews/`, { book_id: bookId, rating, text: '' }, config);
      }
      const booksResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/books/`);
      setBooks(booksResponse.data);
      const reviewsResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/reviews/?user=me`, config);
      setUserReviews(reviewsResponse.data);
    } catch (error) {
      console.error('Error adding quick review:', error);
    }
  };

  const handleAddToReadList = async (bookId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const existingEntry = (diaryEntries || []).find(entry => entry.book.id === parseInt(bookId));
      
      if (existingEntry) {
        // Update existing entry to 'to-read' if it's not already
        if (existingEntry.status !== 'to-read') {
          await axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/diary-entries/${existingEntry.id}/`, { status: 'to-read' }, config);
        }
      } else {
        // Create new diary entry
        await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/diary-entries/`, { book_id: bookId, status: 'to-read' }, config);
      }
      
      // Refresh diary entries
      const diaryResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/diary-entries/`, config);
      setDiaryEntries(diaryResponse.data);
    } catch (error) {
      console.error('Error adding to read list:', error);
    }
  };

  const renderQuickStars = (bookId, currentRating) => {
    const displayRating = quickHoverRating !== null ? quickHoverRating : currentRating;
    return (
      <div className="quick-stars-container">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className="quick-star"
            onMouseEnter={() => setQuickHoverRating(star)}
            onMouseLeave={() => setQuickHoverRating(null)}
            onClick={(e) => { e.stopPropagation(); handleQuickRating(bookId, star); }}
            style={{
              color: star <= displayRating ? '#FFD700' : '#888',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'all 0.15s ease',
              transform: star <= displayRating ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/books/`);
        setBooks(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching books', error);
        setBooks([]);
      }
    };
    const fetchUserReviews = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/reviews/?user=me`, config);
        setUserReviews(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching reviews', error);
        setUserReviews([]);
      }
    };
    const fetchDiaryEntries = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/diary-entries/`, config);
        setDiaryEntries(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching diary entries', error);
        setDiaryEntries([]);
      }
    };
    if (user) {
      fetchBooks();
      fetchUserReviews();
      fetchDiaryEntries();
    }
  }, [user, token]);

  const filteredBooks = (books || []).filter(book => {
    if (!book.cover_url) return false;
    const searchLower = search.toLowerCase();
    const searchWords = searchLower.split(' ').filter(word => word.length > 0);
    if (searchWords.length === 0) return true;
    const titleLower = book.title.toLowerCase();
    const authorNames = book.authors ? book.authors.map(a => a.name.toLowerCase()).join(' ') : '';
    return searchWords.some(word =>
      titleLower.includes(word) || authorNames.includes(word)
    );
  });

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBooks = filteredBooks.slice(startIndex, startIndex + itemsPerPage);

  if (!user) return (
    <div className="book-list-container">
      <div className="auth-message">
        <p>Please log in to view books.</p>
        <Link to="/login" className="btn btn-secondary">Login</Link>
      </div>
    </div>
  );

  return (
    <div className="book-list-container">
      {/* Enhanced Header */}
      <div className="header-section">
        <div className="container-fluid">
          <div className="header-content">
            <div className="header-title">
              <h1>Discover Books</h1>
              <p className="text-muted">Explore thousands of books and share your reviews</p>
            </div>
            <div className="search-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Search by title or author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <i className="bi bi-search search-icon"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Books Section */}
      <section className="section col-24 col-main">
        <div id="films-browser-list-container" className="books-grid">
          {paginatedBooks.map(book => (
            <div
              key={book.id}
              className={`book-poster-wrapper ${hoveredBook && hoveredBook.id === book.id ? 'hovered' : ''}`}
              onMouseEnter={() => handleMouseEnter(book)}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className="book-poster"
                onClick={() => window.location.href = `/books/${book.id}`}
                role="button"
                tabIndex={0}
              >
                <img
                  src={book.cover_url ? `${process.env.REACT_APP_API_BASE_URL}${book.cover_url}` : '/placeholder.jpg'}
                  alt={book.title}
                  className="poster-image"
                  loading="lazy"
                />
                
                {/* Rating Badge */}
                {book.average_rating && (
                  <div className="rating-badge">
                    <span className="rating-stars">{renderStars(book.average_rating)}</span>
                    <span className="rating-number">{book.average_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Hover Popup */}
              {hoveredBook && hoveredBook.id === book.id && (
                <div 
                  className="book-popup"
                  style={{ backgroundImage: `linear-gradient(rgba(26,26,26,0.9), rgba(26,26,26,0.9)), url(${book.cover_url ? `${process.env.REACT_APP_API_BASE_URL}${book.cover_url}` : '/placeholder.jpg'})` }}
                  onMouseEnter={handlePopupMouseEnter}
                  onMouseLeave={handlePopupMouseLeave}
                  onClick={() => window.location.href = `/books/${book.id}`}
                >
                  <div className="popup-header">
                    <h6 className="popup-title">{book.title}</h6>
                  </div>

                  <div className="popup-authors">
                    {book.authors?.slice(0, 2).map(a => a.name).join(', ')}
                    {book.authors?.length > 2 ? ' +' + (book.authors.length - 2) : ''}
                  </div>

                  <p className="popup-description">
                    {book.description?.substring(0, 120)}...
                  </p>

                  {/* Details Section */}
                  <div className="popup-details">
                    {book.publication_year && <span>📅 {book.publication_year}</span>}
                    {book.genres && book.genres.length > 0 && <span>🏷️ {book.genres.slice(0, 2).map(g => g.name).join(', ')}</span>}
                    {book.pages && <span>📖 {book.pages} pages</span>}
                    {book.review_count && <span>📝 {book.review_count} reviews</span>}
                    {book.publisher && <span>🏢 {book.publisher.name || book.publisher}</span>}
                  </div>

                  {/* Rating Section */}
                  <div className="rating-section">
                    <div className="avg-rating">
                      <span className="label">Community Rating</span>
                      <div className="rating-display">
                        <span className="stars">{renderStars(book.average_rating || 0)}</span>
                        <span className="number">{book.average_rating ? book.average_rating.toFixed(1) : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Your Rating Section */}
                    {user && (
                      <div className="your-rating">
                        <span className="label">Your Rating</span>
                        {renderQuickStars(book.id, (userReviews || []).find(r => r.book_id === book.id)?.rating || 0)}
                      </div>
                    )}
                  </div>

                  {/* Read Icon */}
                  {user && (
                    <div className="read-icon-section">
                      <div
                        className={`read-icon ${diaryEntries.some(entry => entry.book.id === book.id && entry.status === 'to-read') ? 'added' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToReadList(book.id);
                        }}
                        onMouseEnter={(e) => {
                          const tooltip = e.currentTarget.querySelector('.read-tooltip');
                          if (tooltip) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            tooltip.style.left = `${rect.left + rect.width / 2}px`;
                            tooltip.style.top = `${rect.bottom + 5}px`;
                            tooltip.style.opacity = '1';
                            tooltip.style.visibility = 'visible';
                          }
                        }}
                        onMouseLeave={(e) => {
                          const tooltip = e.currentTarget.querySelector('.read-tooltip');
                          if (tooltip) {
                            tooltip.style.opacity = '0';
                            tooltip.style.visibility = 'hidden';
                          }
                        }}
                      >
                        {diaryEntries.some(entry => entry.book.id === book.id && entry.status === 'to-read') ? '📖' : '➕'}
                        <div className="read-tooltip">
                          {diaryEntries.some(entry => entry.book.id === book.id && entry.status === 'to-read') ? 'Added to Reading List' : 'Want to Read'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Enhanced Pagination */}
      <div className="pagination-section">
        <hr className="divider" />
        <nav className="pagination-nav">
          <button
            className="btn btn-secondary pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          
          <div className="page-counter">
            <span>Page {currentPage} of {totalPages || 1}</span>
          </div>

          <button
            className="btn btn-secondary pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </nav>
      </div>
    </div>
  );
};

export default BookList;