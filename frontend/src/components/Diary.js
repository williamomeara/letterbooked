import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Diary = () => {
  const [entries, setEntries] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/diary-entries/`);
      setEntries(response.data);
      } catch (error) {
        console.error('Error fetching diary entries', error);
      }
    };
    if (user) fetchEntries();
  }, [user]);

  if (!user) return <p>Please login.</p>;

  return (
    <div>
      <h2>My Diary</h2>
      {entries.map(entry => (
        <div key={entry.id} className="mb-3">
          <h4>{entry.book.title}</h4>
          <p>Status: {entry.status}</p>
          {entry.date_read && <p>Date Read: {entry.date_read}</p>}
        </div>
      ))}
    </div>
  );
};

export default Diary;