import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
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
  const [clickedBookId, setClickedBookId] = useState(null); // Track clicked book on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedGenre, setSelectedGenre] = useState('');
  const { user, token } = useContext(AuthContext);

  // Detect mobile/desktop view
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close popup when scrolling on mobile
  useEffect(() => {
    if (isMobile && clickedBookId !== null) {
      const handleScroll = () => setClickedBookId(null);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [clickedBookId, isMobile]);

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
      const existingReview = (userReviews || []).find(review => review.book_id === parseInt(bookId));
      
      if (existingReview) {
        // Update existing review - optimistic update
        const response = await api.patch(`/api/reviews/${existingReview.id}/`, { rating, text: '' });
        const updatedReview = { ...existingReview, rating };
        setUserReviews(prevReviews => 
          prevReviews.map(r => r.id === existingReview.id ? updatedReview : r)
        );
      } else {
        // Create new review - optimistic update
        const response = await api.post(`/api/reviews/`, { book_id: bookId, rating, text: '' });
        const newReview = {
          ...response.data,
          book_id: parseInt(bookId), // Ensure book_id is set
          user: user.username,
          rating: rating,
          text: '',
          created_at: new Date().toISOString()
        };
        setUserReviews(prevReviews => [...prevReviews, newReview]);
      }
      
      // Update books to refresh average ratings
      const booksResponse = await api.get(`/api/books/`);
      setBooks(booksResponse.data);
      
    } catch (error) {
      console.error('Error adding quick review:', error);
      // Re-fetch user reviews on error to ensure consistency
      try {
        const reviewsResponse = await api.get(`/api/reviews/?user=me`);
        setUserReviews(reviewsResponse.data);
      } catch (fetchError) {
        console.error('Error re-fetching reviews:', fetchError);
      }
    }
  };

  const handleAddToReadList = async (bookId) => {
    try {
      const existingEntry = (diaryEntries || []).find(entry => entry.book.id === parseInt(bookId));
      
      if (existingEntry) {
        // Update existing entry to 'to-read' if it's not already
        if (existingEntry.status !== 'to-read') {
          await api.patch(`/api/diary-entries/${existingEntry.id}/`, { status: 'to-read' });
        }
      } else {
        // Create new diary entry
        await api.post(`/api/diary-entries/`, { book_id: bookId, status: 'to-read' });
      }
      
      // Refresh diary entries
      const diaryResponse = await api.get(`/api/diary-entries/`);
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
        const response = await api.get(`/api/books/`);
        setBooks(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching books', error);
        setBooks([]);
      }
    };
    const fetchUserReviews = async () => {
      try {
        const response = await api.get(`/api/reviews/?user=me`);
        setUserReviews(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching reviews', error);
        setUserReviews([]);
      }
    };
    const fetchDiaryEntries = async () => {
      try {
        const response = await api.get(`/api/diary-entries/`);
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
  }, [user]);

  const filteredBooks = (books || [])
    .filter(book => {
      if (!book.cover_url) return false;
      const searchLower = search.toLowerCase();
      const searchWords = searchLower.split(' ').filter(word => word.length > 0);
      if (searchWords.length === 0 && !selectedGenre) return true;
      
      const titleLower = book.title.toLowerCase();
      const authorNames = book.authors ? book.authors.map(a => a.name.toLowerCase()).join(' ') : '';
      const matchesSearch = searchWords.length === 0 || searchWords.some(word =>
        titleLower.includes(word) || authorNames.includes(word)
      );
      const matchesGenre = !selectedGenre || (book.genres && book.genres.some(g => g.name === selectedGenre));
      
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'author':
          aValue = a.authors?.[0]?.name?.toLowerCase() || '';
          bValue = b.authors?.[0]?.name?.toLowerCase() || '';
          break;
        case 'rating':
          aValue = a.average_rating || 0;
          bValue = b.average_rating || 0;
          break;
        case 'year':
          aValue = a.publication_year || 0;
          bValue = b.publication_year || 0;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
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

      {/* Content Navigation */}
      <div id="content-nav">
        <div className="sorting-selects">
          <div className="smenu-wrapper">
            <div className="smenu-label">Sort by:</div>
            <div className="smenu">
              <input type="checkbox" id="sort-menu" style={{ display: 'none' }} />
              <label htmlFor="sort-menu" onClick={() => {}}>
                {sortBy === 'title' && 'Title'}
                {sortBy === 'author' && 'Author'}
                {sortBy === 'rating' && 'Rating'}
                {sortBy === 'year' && 'Year'}
                <span className={`s icon ${sortOrder === 'desc' ? 'rotated' : ''}`}></span>
              </label>
              <ul className="smenu-menu">
                <li className={sortBy === 'title' ? 'selected' : 'item'} onClick={() => setSortBy('title')}>Title</li>
                <li className={sortBy === 'author' ? 'selected' : 'item'} onClick={() => setSortBy('author')}>Author</li>
                <li className={sortBy === 'rating' ? 'selected' : 'item'} onClick={() => setSortBy('rating')}>Rating</li>
                <li className={sortBy === 'year' ? 'selected' : 'item'} onClick={() => setSortBy('year')}>Year</li>
              </ul>
            </div>
          </div>

          <div className="smenu-wrapper">
            <div className="smenu-label">Order:</div>
            <div className="smenu">
              <input type="checkbox" id="order-menu" style={{ display: 'none' }} />
              <label htmlFor="order-menu">
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </label>
              <ul className="smenu-menu">
                <li className={sortOrder === 'asc' ? 'selected' : 'item'} onClick={() => setSortOrder('asc')}>Ascending</li>
                <li className={sortOrder === 'desc' ? 'selected' : 'item'} onClick={() => setSortOrder('desc')}>Descending</li>
              </ul>
            </div>
          </div>

          <div className="smenu-wrapper">
            <div className="smenu-label">Genre:</div>
            <div className="smenu">
              <input type="checkbox" id="genre-menu" style={{ display: 'none' }} />
              <label htmlFor="genre-menu">
                {selectedGenre || 'All Genres'}
              </label>
              <ul className="smenu-menu">
                <li className={!selectedGenre ? 'selected' : 'item'} onClick={() => setSelectedGenre('')}>All Genres</li>
                {Array.from(new Set(books.flatMap(book => book.genres?.map(g => g.name) || [])))
                  .sort()
                  .map(genre => (
                    <li 
                      key={genre} 
                      className={selectedGenre === genre ? 'selected' : 'item'} 
                      onClick={() => setSelectedGenre(genre)}
                    >
                      {genre}
                    </li>
                  ))}
              </ul>
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
              className={`book-poster-wrapper ${hoveredBook && hoveredBook.id === book.id ? 'hovered' : ''} ${clickedBookId === book.id ? 'clicked' : ''}`}
              onMouseEnter={() => handleMouseEnter(book)}
              onMouseLeave={handleMouseLeave}
              onClick={() => isMobile && setClickedBookId(clickedBookId === book.id ? null : book.id)}
            >
              <div
                className="book-poster"
                onClick={(e) => {
                  if (isMobile) {
                    // On mobile, only navigate if popup is already open (second click)
                    if (clickedBookId === book.id) {
                      window.location.href = `/books/${book.id}`;
                    }
                    // If popup not open, let the wrapper click handler open it
                  } else {
                    // Desktop: direct navigation on click
                    window.location.href = `/books/${book.id}`;
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <img
                  src={book.cover_url || '/placeholder.jpg'}
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

              {/* Hover/Tap Popup - Desktop Only */}
              {hoveredBook && hoveredBook.id === book.id && !isMobile && (
                <div 
                  className="book-popup"
                  style={{ backgroundImage: `linear-gradient(rgba(26,26,26,0.9), rgba(26,26,26,0.9)), url(${book.cover_url || '/placeholder.jpg'})` }}
                  onMouseEnter={handlePopupMouseEnter}
                  onMouseLeave={handlePopupMouseLeave}
                  onClick={(e) => { e.stopPropagation(); window.location.href = `/books/${book.id}`; }}
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

      {/* Mobile Popup Backdrop */}
      {isMobile && clickedBookId && (
        <div 
          className="mobile-popup-backdrop" 
          onClick={(e) => { e.stopPropagation(); setClickedBookId(null); }}
        ></div>
      )}

      {/* Mobile Popup */}
      {isMobile && clickedBookId && (() => {
        const popupBook = paginatedBooks.find(b => b.id === clickedBookId);
        return popupBook ? (
          <div 
            className="book-popup mobile-popup"
            style={{ backgroundImage: `linear-gradient(rgba(26,26,26,0.98), rgba(26,26,26,0.98)), url(${popupBook.cover_url || '/placeholder.jpg'})` }}
            onClick={(e) => { e.stopPropagation(); window.location.href = `/books/${popupBook.id}`; }}
          >
            <div className="popup-header">
              <h6 className="popup-title">{popupBook.title}</h6>
            </div>

            <div className="popup-authors">
              {popupBook.authors?.slice(0, 2).map(a => a.name).join(', ')}
              {popupBook.authors?.length > 2 ? ' +' + (popupBook.authors.length - 2) : ''}
            </div>

            <p className="popup-description">
              {popupBook.description?.substring(0, 120)}...
            </p>

            {/* Details Section */}
            <div className="popup-details">
              {popupBook.publication_year && <span>📅 {popupBook.publication_year}</span>}
              {popupBook.genres && popupBook.genres.length > 0 && <span>🏷️ {popupBook.genres.slice(0, 2).map(g => g.name).join(', ')}</span>}
              {popupBook.pages && <span>📖 {popupBook.pages} pages</span>}
              {popupBook.review_count && <span>📝 {popupBook.review_count} reviews</span>}
              {popupBook.publisher && <span>🏢 {popupBook.publisher.name || popupBook.publisher}</span>}
            </div>

            {/* Rating Section */}
            <div className="rating-section">
              <div className="avg-rating">
                <span className="label">Community Rating</span>
                <div className="rating-display">
                  <span className="stars">{renderStars(popupBook.average_rating || 0)}</span>
                  <span className="number">{popupBook.average_rating ? popupBook.average_rating.toFixed(1) : 'N/A'}</span>
                </div>
              </div>

              {/* Your Rating Section */}
              {user && (
                <div className="your-rating">
                  <span className="label">Your Rating</span>
                  {renderQuickStars(popupBook.id, (userReviews || []).find(r => r.book_id === popupBook.id)?.rating || 0)}
                </div>
              )}
            </div>

            {/* Read Icon */}
            {user && (
              <div className="read-icon-section">
                <div
                  className={`read-icon ${diaryEntries.some(entry => entry.book.id === popupBook.id && entry.status === 'to-read') ? 'added' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToReadList(popupBook.id);
                  }}
                >
                  {diaryEntries.some(entry => entry.book.id === popupBook.id && entry.status === 'to-read') ? '📖' : '➕'}
                  <div className="read-tooltip">
                    {diaryEntries.some(entry => entry.book.id === popupBook.id && entry.status === 'to-read') ? 'Added to Reading List' : 'Want to Read'}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Close Button */}
            <div className="mobile-close-btn" onClick={(e) => { e.stopPropagation(); setClickedBookId(null); }}>
              ✕
            </div>
          </div>
        ) : null;
      })()}

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