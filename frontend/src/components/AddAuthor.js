import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const AddAuthor = () => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const { user } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/authors/`, { name, bio });
      alert('Author added');
    } catch (error) {
      alert('Error adding author');
    }
  };

  if (!user || user.role !== 'admin') return <p>Access denied.</p>;

  return (
    <div>
      <h2>Add Author</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Name</label>
          <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label>Bio</label>
          <textarea className="form-control" value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-secondary">Add Author</button>
      </form>
    </div>
  );
};

export default AddAuthor;