import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar navbar-expand-lg custom-navbar">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <span className="brand-icon">📚</span>
          Letterbooked
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Discover</Link>
            </li>
            {user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/diary">Diary</Link>
                </li>
                {(user.role === 'author' || user.role === 'admin') && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/add-book">Add Book</Link>
                  </li>
                )}
                {user.role === 'admin' && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/add-author">Add Author</Link>
                  </li>
                )}
              </>
            )}
          </ul>
          <div className="navbar-nav ms-auto d-flex align-items-center">
            {user ? (
              <>
                <span className="navbar-text welcome-text me-3">
                  Welcome, <strong>{user.username}</strong>
                  {user.role && <small className="text-muted"> ({user.role})</small>}
                </span>
                <button className="btn btn-outline-light btn-sm" onClick={logout}>
                  <i className="bi bi-box-arrow-right me-1"></i>Logout
                </button>
              </>
            ) : (
              <>
                <Link className="nav-link" to="/login">
                  <i className="bi bi-person-circle me-1"></i>Login
                </Link>
                <Link className="btn btn-primary btn-sm ms-2" to="/register">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;