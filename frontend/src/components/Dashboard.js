import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({});
  const [recentReviews, setRecentReviews] = useState([]);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch user stats
      const statsRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/user/stats/`, config);
      setStats(statsRes.data);

      // Fetch recent reviews by user
      const reviewsRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/reviews/?user=${user.username}&ordering=-created_at&limit=5&include_book=true`, config);
      setRecentReviews(reviewsRes.data);

      // Fetch trending books (top-rated)
      const trendingRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/books/?ordering=-average_rating&limit=10`);
      setTrendingBooks(trendingRes.data);

      // Fetch recent activity (likes on user's reviews, etc.)
      const activityRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/user/activity/`, config);
      setActivity(activityRes.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (!user) return <p>Please login.</p>;
  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="dashboard">
      <h1>Your Dashboard</h1>

      {/* User Stats */}
      <section className="stats-section">
        <h2>Your Stats</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.total_reviews || 0}</h3>
            <p>Total Reviews</p>
          </div>
          <div className="stat-card">
            <h3>{stats.avg_rating ? stats.avg_rating.toFixed(1) : 0}/5</h3>
            <p>Average Rating Given</p>
          </div>
          <div className="stat-card">
            <h3>{stats.books_reviewed || 0}</h3>
            <p>Books Reviewed</p>
          </div>
          <div className="stat-card">
            <h3>{stats.likes_received || 0}</h3>
            <p>Likes Received</p>
          </div>
        </div>
      </section>

      {/* Recent Reviews */}
      <section className="recent-reviews-section">
        <h2>Your Recent Reviews</h2>
        <div className="reviews-list">
          {recentReviews.length > 0 ? (
            recentReviews.map(review => (
              <Link key={review.id} to={`/books/${review.book.id}`} className="review-card-link">
                <div className="review-card">
                  <img src={review.book.cover_url ? `${process.env.REACT_APP_API_BASE_URL}${review.book.cover_url}` : '/placeholder-book.png'} alt={review.book.title} />
                  <div className="review-content">
                    <h3>{review.book.title}</h3>
                    <p className="rating">Rating: {'★'.repeat(Math.floor(review.rating))}{'☆'.repeat(5 - Math.floor(review.rating))} ({review.rating})</p>
                    <p className="review-text">{review.text ? review.text.substring(0, 100) + '...' : 'No review text'}</p>
                    <p className="review-date">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p>No reviews yet. Start reviewing books!</p>
          )}
        </div>
      </section>

      {/* Trending Books */}
      <section className="trending-books-section">
        <h2>Trending Books</h2>
        <div className="books-grid">
          {trendingBooks.map(book => (
            <Link key={book.id} to={`/books/${book.id}`} className="book-card-link">
              <div className="book-card">
                <img src={book.cover_url ? `${process.env.REACT_APP_API_BASE_URL}${book.cover_url}` : '/placeholder-book.png'} alt={book.title} />
                <h3>{book.title}</h3>
                <p>Avg Rating: {book.average_rating ? book.average_rating.toFixed(1) : 'N/A'}/5</p>
                <p>{book.reviews_count || 0} reviews</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Activity Feed */}
      <section className="activity-feed-section">
        <h2>Recent Activity</h2>
        <ul className="activity-list">
          {activity.length > 0 ? (
            activity.map(item => (
              <li key={item.id} className="activity-item">
                {item.description} - {new Date(item.created_at).toLocaleDateString()}
              </li>
            ))
          ) : (
            <p>No recent activity.</p>
          )}
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;