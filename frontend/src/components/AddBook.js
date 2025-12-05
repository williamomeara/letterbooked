import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const AddBook = () => {
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [description, setDescription] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const response = await api.get(`/api/authors/`);
        setAuthors(response.data);
      } catch (error) {
        console.error('Error fetching authors', error);
      }
    };
    fetchAuthors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/books/`, { title, authors: selectedAuthors, description });
      alert('Book added');
    } catch (error) {
      alert('Error adding book');
    }
  };

  if (!user || (user.role !== 'author' && user.role !== 'admin')) return <p>Access denied.</p>;

  return (
    <div>
      <h2>Add Book</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Title</label>
          <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label>Authors</label>
          <select multiple className="form-control" value={selectedAuthors} onChange={(e) => setSelectedAuthors([...e.target.selectedOptions].map(o => o.value))}>
            {authors.map(author => <option key={author.id} value={author.id}>{author.name}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label>Description</label>
          <textarea className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-secondary">Add Book</button>
      </form>
    </div>
  );
};

export default AddBook;