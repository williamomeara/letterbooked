import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';
import AddBook from './components/AddBook';
import AddAuthor from './components/AddAuthor';
import Dashboard from './components/Dashboard';
import Diary from './components/Diary';
import EnvDebug from './components/EnvDebug';
import './App.css';

function App() {
  return (
    <Router>
      <div data-bs-theme="dark" className="min-vh-100 bg-dark text-light">
        <EnvDebug />
        <Navbar />
        <div className="content-wrapper mt-4">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<BookList />} />
            <Route path="/books/:id" element={<BookDetail />} />
            <Route path="/add-book" element={<AddBook />} />
            <Route path="/add-author" element={<AddAuthor />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/diary" element={<Diary />} />
          </Routes>
        </div>
        <footer className="bg-dark text-light py-4 mt-5 page-footer">
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                <a href="#" className="text-light text-decoration-none me-3">About</a>
                <a href="#" className="text-light text-decoration-none me-3">Pro</a>
                <a href="#" className="text-light text-decoration-none me-3">News</a>
                <a href="#" className="text-light text-decoration-none me-3">Apps</a>
                <a href="#" className="text-light text-decoration-none me-3">Year in Review</a>
                <a href="#" className="text-light text-decoration-none me-3">Gifts</a>
                <a href="#" className="text-light text-decoration-none me-3">Help</a>
                <a href="#" className="text-light text-decoration-none me-3">Terms</a>
                <a href="#" className="text-light text-decoration-none me-3">API</a>
                <a href="#" className="text-light text-decoration-none">Contact</a>
              </div>
              <div className="col-md-6 text-end">
                <a href="#" className="text-light text-decoration-none me-3">Instagram</a>
                <a href="#" className="text-light text-decoration-none me-3">X</a>
                <a href="#" className="text-light text-decoration-none">YouTube</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
