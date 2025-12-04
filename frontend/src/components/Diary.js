import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './Diary.css';

const Diary = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingEntry, setUpdatingEntry] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  // Refresh diary entries when component mounts or window regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchEntries();
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/diary-entries/`, config);
      setEntries(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching diary entries', error);
      setLoading(false);
    }
  };

  const handleUpdateEntry = async (entryId, newStatus) => {
    setUpdatingEntry(entryId);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const data = {
        status: newStatus
      };

      const response = await axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/diary-entries/${entryId}/`, data, config);
      await fetchEntries(); // Refresh entries
    } catch (error) {
      console.error('Error updating diary entry:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      alert('Failed to update diary entry. Please try again.');
    } finally {
      setUpdatingEntry(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'read': return '#28a745';
      case 'reading': return '#ffc107';
      case 'to-read': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getDiaryStats = () => {
    const stats = {
      total: entries.length,
      read: entries.filter(e => e.status === 'read').length,
      reading: entries.filter(e => e.status === 'reading').length,
      toRead: entries.filter(e => e.status === 'to-read').length
    };
    return stats;
  };

  const getFilteredEntries = () => {
    if (filterStatus === 'all') {
      return entries;
    }
    return entries.filter(entry => entry.status === filterStatus);
  };

  if (!user) return <p>Please login.</p>;
  if (loading) return <p>Loading diary...</p>;

  const stats = getDiaryStats();
  const filteredEntries = getFilteredEntries();

  return (
    <div className="diary-page">
      <div className="diary-header">
        <h1>My Reading Diary</h1>
        <button
          className="btn btn-outline-secondary refresh-btn"
          onClick={() => fetchEntries()}
          title="Refresh diary data"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Diary Stats */}
      <div className="diary-stats">
        <div className="stat-card">
          <h3>{stats.total}</h3>
          <p>Total Books</p>
        </div>
        <div className="stat-card">
          <h3>{stats.read}</h3>
          <p>Books Read</p>
        </div>
        <div className="stat-card">
          <h3>{stats.reading}</h3>
          <p>Currently Reading</p>
        </div>
        <div className="stat-card">
          <h3>{stats.toRead}</h3>
          <p>To Read</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="diary-filters">
        <button
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All Books ({stats.total})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'to-read' ? 'active' : ''}`}
          onClick={() => setFilterStatus('to-read')}
        >
          To Read ({stats.toRead})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'reading' ? 'active' : ''}`}
          onClick={() => setFilterStatus('reading')}
        >
          Currently Reading ({stats.reading})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'read' ? 'active' : ''}`}
          onClick={() => setFilterStatus('read')}
        >
          Finished Reading ({stats.read})
        </button>
      </div>

      {/* Diary Entries */}
      <div className="diary-entries">
        <h2>Your Books {filterStatus !== 'all' && `(${filterStatus.replace('-', ' ')})`}</h2>
        {filteredEntries.length === 0 ? (
          <div className="no-entries">
            <p>
              {filterStatus === 'all'
                ? 'Your reading diary is empty. Start by adding some books!'
                : `No books marked as "${filterStatus.replace('-', ' ')}".`
              }
            </p>
          </div>
        ) : (
          <div className="entries-grid">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="diary-entry-card">
                <Link to={`/books/${entry.book.id}`} className="entry-book-link">
                  <div className="entry-book-info">
                    <img
                      src={entry.book.cover_url || '/placeholder-book.png'}
                      alt={entry.book.title}
                      className="entry-book-cover"
                    />
                    <div className="entry-book-details">
                      <h4>{entry.book.title}</h4>
                      <p className="entry-authors">{entry.book.authors.map(a => a.name).join(', ')}</p>
                    </div>
                  </div>
                </Link>

                <div className="entry-status">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(entry.status) }}
                  >
                    {entry.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                {entry.read_date && entry.status !== 'to-read' && (
                  <div className="entry-date">
                    <small>
                      {entry.status === 'read' ? 'Finished: ' :
                       entry.status === 'reading' ? 'Started: ' : 'Target: '}
                      {entry.read_date ? new Date(entry.read_date).toLocaleDateString() : 'Date not set'}
                    </small>
                  </div>
                )}

                {!entry.read_date && entry.status !== 'to-read' && (
                  <div className="entry-date-missing">
                    <small className="text-warning">
                      {entry.status === 'read' ? 'Completion date not set' :
                       entry.status === 'reading' ? 'Start date not set' : 'Target date not set'}
                    </small>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Diary;