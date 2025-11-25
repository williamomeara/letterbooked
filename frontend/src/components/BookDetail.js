import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ReviewForm from './ReviewForm';

const BookDetail = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [diaryEntry, setDiaryEntry] = useState(null);
  const [status, setStatus] = useState('to-read');
  const [dateRead, setDateRead] = useState('');
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
        <span className="ms-1">({rating.toFixed(1)})</span>
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
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/reviews/`);
        const allReviews = response.data.filter(review => review.book.id === parseInt(id));
        setReviews(allReviews.filter(review => review.user !== user.username));
        if (user) {
          const myReview = allReviews.find(review => review.user === user.username);
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
          setDateRead(entry.date_read || '');
        }
      } catch (error) {
        console.error('Error fetching diary entry', error);
      }
    };
    if (user) {
      fetchBook();
      fetchReviews();
      fetchDiaryEntry();
    }
  }, [id, user]);

  const updateDiaryStatus = async (newStatus) => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const data = { status: newStatus, date_read: dateRead || currentDate };
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/diary-entries/`, { book_id: id, ...data }, config);
      setDiaryEntry(response.data);
    } catch (error) {
      alert('Error updating diary');
    }
  };

  if (!user) return <p>Please login.</p>;
  if (!book) return <p>Loading...</p>;

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-4">
          <h1 className="mb-2">{book.title}</h1>
          <p className="mb-1">By {book.authors && book.authors.map(a => a.name).join(', ')}</p>
          <p className="mb-1">{book.publication_date ? new Date(book.publication_date).getFullYear() : ''}</p>
          <p className="mb-3">Average Rating: {book.avg_rating ? renderStars(book.avg_rating) : 'No ratings'}</p>
            <div className="mb-3">
              <label className="form-label">Diary Status:</label>
              <div className="d-flex gap-2">
                <button className={`btn ${status === 'to-read' ? 'btn-secondary' : 'btn-outline-light'}`} onClick={() => { setStatus('to-read'); updateDiaryStatus('to-read'); }}>To Read</button>
                <button className={`btn ${status === 'reading' ? 'btn-secondary' : 'btn-outline-light'}`} onClick={() => { setStatus('reading'); updateDiaryStatus('reading'); }}>Reading</button>
                <button className={`btn ${status === 'read' ? 'btn-secondary' : 'btn-outline-light'}`} onClick={() => { setStatus('read'); updateDiaryStatus('read'); }}>Read</button>
              </div>
            </div>
        </div>
        <div className="col-md-8 mb-4">
          {book.cover_url ? (
            <img src={`${process.env.REACT_APP_API_BASE_URL}${book.cover_url}`} alt={book.title} className="rounded" style={{width: '300px', height: '450px', objectFit: 'cover'}} />
          ) : (
            <div style={{height: '450px', width: '300px', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'}} className="rounded">No Image</div>
          )}
        </div>
      </div>
      <ul className="nav nav-tabs mt-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Reviews</button>
        </li>
      </ul>
      <div className="tab-content mt-3">
        {activeTab === 'overview' && (
          <div>
            <h4>Description</h4>
            <p>{book.description}</p>
            <h4>Details</h4>
            <p><strong>Genre:</strong> {book.genre}</p>
            <p><strong>Pages:</strong> {book.page_count}</p>
            <p><strong>ISBN:</strong> {book.isbn}</p>
            <p><strong>Publisher:</strong> {book.publisher ? book.publisher.name : ''}</p>
          </div>
        )}
        {activeTab === 'reviews' && (
          <div>
            <h4>Reviews</h4>
            {reviews.map(review => (
              <div key={review.id} className="mb-3 p-3 border rounded">
                <p><strong>{review.user}:</strong> {'★'.repeat(Math.floor(review.rating))}{(review.rating % 1 >= 0.5 ? <span style={{opacity: 0.5}}>★</span> : '')}{'☆'.repeat(5 - Math.floor(review.rating) - (review.rating % 1 >= 0.5 ? 1 : 0))}</p>
                <p>{review.text}</p>
              </div>
            ))}
            <ReviewForm bookId={id} existingReview={userReview} loading={loadingReviews} onReviewAdded={() => window.location.reload()} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetail;